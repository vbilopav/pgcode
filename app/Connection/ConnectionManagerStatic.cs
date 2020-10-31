using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Data;
using System.Data.SQLite;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using Pgcode.Execution;
using Pgcode.Migrations;

namespace Pgcode.Connection
{
    public sealed partial class ConnectionManager
    {
        private static ImmutableDictionary<string, ConnectionData> _connections;
        private static readonly ConcurrentDictionary<string, WorkspaceConnection> WorkspaceConnections = new ConcurrentDictionary<string, WorkspaceConnection>();

        private static readonly IEnumerable<string> InfoLevels = new[] { "INFO", "NOTICE", "LOG" };
        private static readonly IEnumerable<string> ErrorLevels = new[] { "ERROR", "PANIC" };

        public static bool Initialize(IConfiguration configuration)
        {
            var connections = new Dictionary<string, ConnectionData>();
            var passwords = GetPasswordDict(configuration);
            Console.WriteLine();

            var children = configuration.GetSection("ConnectionStrings").GetChildren().ToList();
            var count = children.Count;
            int current = 1;
            foreach (var section in children)
            {
                Console.Write("Initializing connections ");
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.Write($"{current++} of {count}");
                Console.Write(": ");
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.Write($"{section.Key}");
                Console.ResetColor();

                var (connection, connectionString) = TryCreateConnection(section, passwords);
                if (connection == null)
                {
                    continue;
                }
                var migrations = new MigrationRunner(connection, Program.Settings);
                try
                {
                    connection.Open();
                    Console.ResetColor();
                    Console.Write(" ... ");
                    Console.ForegroundColor = ConsoleColor.Green;
                    int availableVersion;
                    int? schemaVersion;
                    (schemaVersion, availableVersion) = migrations.GetSchemaVersions();
                    var serverVersion = connection.ServerVersion;

                    if (Convert.ToDecimal(serverVersion) < Convert.ToDecimal(Program.Settings.MinimalPgVersion))
                    {
                        throw new Exception($"PostgreSQL connection name '{section.Key}' is version {serverVersion} that is not supported. Lowest supported version is {Program.Settings.MinimalPgVersion}");
                    }

                    Console.Write("success, server version {0}", serverVersion);
                    if (schemaVersion == availableVersion)
                    {
                        Console.WriteLine(", schema version {0}", schemaVersion);
                    }
                    else
                    {
                        Console.WriteLine();
                        Console.ForegroundColor = ConsoleColor.Red;
                        
                        if (schemaVersion == null)
                        {
                            Console.WriteLine(
                                "No migration applied for connection {0}, latest available is {1}. Upgrading migrations now.",
                                section.Key, availableVersion);
                            Console.WriteLine();
                            RunMigrations(configuration, runner => runner.Up(null), section.Key);
                        }
                        else
                        {
                            if (schemaVersion > availableVersion)
                            {
                                Console.WriteLine("Connection {0}. appears to have to many migrations.",
                                    section.Key);
                                Console.WriteLine(
                                    "Current schema version is {0}, latest available is {1}. Downgrading migrations now.",
                                    schemaVersion, availableVersion);
                                Console.WriteLine();
                                RunMigrations(configuration, runner => runner.Down(null), section.Key);
                            }
                            else
                            {
                                Console.WriteLine("Some migrations appear to be missing for connection {0}.",
                                    section.Key);
                                Console.WriteLine(
                                    "Current schema version is {0}, latest available is {1}. Downgrading migrations now.",
                                    schemaVersion, availableVersion);
                                Console.WriteLine();
                                RunMigrations(configuration, runner => runner.Up(null), section.Key);
                            }

                            schemaVersion = availableVersion;
                        }
                    }
                    Console.ResetColor();

                    connections.Add(section.Key, new ConnectionData
                    {
                        Connection = connection,
                        ConnectionString = connectionString,
                        Name = section.Key,
                        SchemaVersion = schemaVersion,
                        ServerVersion = serverVersion
                    });
                }
                catch (Exception e)
                {
                    Console.ResetColor();
                    Console.Write(" ... ");
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("failed: {0}", e.Message);
                    Console.ResetColor();
                }
                finally
                {
                    connection.Close();
                }
            }

            Console.WriteLine();
            if (connections.Keys.Count == 0)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Error: no available connections, exiting...");
                Console.ResetColor();
                return false;
            }

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("Total {0} connection(s) available: {1}", connections.Keys.Count, string.Join(", ", connections.Keys));
            Console.WriteLine();
            Console.ResetColor();

            _connections = connections.ToImmutableDictionary();
            return true;
        }

        public static void AddLoggers(ILoggerFactory loggerFactory)
        {
            foreach (var (_, value) in _connections)
            {
                value.Logger = loggerFactory.CreateLogger(value.Connection.ConnectionString);
            }
        }

        public static void MigrationsInfo(IConfiguration configuration, string forConnection)
        {
            RunMigrations(configuration, runner =>
            {
                var (schemaVersion, availableVersion) = runner.GetSchemaVersions();
                Console.ResetColor();
                Console.Write("Schema version is ");
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine(schemaVersion);
                Console.ResetColor();
                Console.Write("Available version is ");
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine(availableVersion);
            }, forConnection);
        }

        public static void MigrationsUp(IConfiguration configuration, int? upToVersion, string forConnection, bool routinesOnly = false) =>
            RunMigrations(configuration, runner => runner.Up(upToVersion, routinesOnly), forConnection, routinesOnly);

        public static void MigrationsDown(IConfiguration configuration, int? downToVersion, string forConnection, bool routinesOnly = false) =>
            RunMigrations(configuration, runner => runner.Down(downToVersion, routinesOnly), forConnection, routinesOnly);

        public static void AddNoticeHandlersToConnections(ILoggerFactory loggerFactory)
        {
            foreach (var (key, value) in _connections)
            {
                value.Connection.Notice += (sender, args) =>
                {
                    var severity = args.Notice.Severity;
                    var msg = $"{args.Notice.Where}:{Environment.NewLine}{args.Notice.MessageText}{Environment.NewLine}";
                    if (InfoLevels.Contains(severity))
                    {
                        value.Logger.LogInformation(msg);
                    }
                    else if (severity == "WARNING")
                    {
                        value.Logger.LogWarning(msg);
                    }
                    else if (severity.StartsWith("DEBUG"))
                    {
                        value.Logger.LogDebug(msg);
                    }
                    else if (ErrorLevels.Contains(severity))
                    {
                        value.Logger.LogError(msg);
                    }
                    else
                    {
                        value.Logger.LogTrace(msg);
                    }
                };
            }
        }

        private static void RunMigrations(IConfiguration configuration, Action<MigrationRunner> action, string forConnection, bool routinesOnly = false)
        {
            var children = configuration.GetSection("ConnectionStrings").GetChildren().ToList();
            var passwords = GetPasswordDict(configuration);
            foreach (var section in children)
            {
                if (forConnection != null && section.Key != forConnection)
                {
                    continue;
                }
                var (connection, _) = TryCreateConnection(section, passwords);
                var migrations = new MigrationRunner(connection, Program.Settings);
                Console.ResetColor();
                Console.Write(!routinesOnly ? "Migrating Connection: " : "Updating routines for connection: ");
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine(section.Key);
                
                Console.ResetColor();
                try
                {
                    connection.Open();

                    Console.ForegroundColor = ConsoleColor.Yellow;
                    if (Program.IsDebug)
                    {
                        connection.Notice += (sender, args) =>
                        {
                            Console.WriteLine(args.Notice.MessageText);
                        };
                    }

                    try
                    {
                        action(migrations);
                    }
                    catch (MigrationRunnerException e)
                    {
                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.WriteLine("Failed to apply migration for connection {0}, version {1}", section.Key, e.Version);
                        Console.WriteLine("Error:");
                        Console.WriteLine(e.PostgresException);
                        Console.ResetColor();
                    }
                    Console.ResetColor();
                }
                finally
                {
                    connection.Close();
                }
                Console.WriteLine();
            }
        }

        private static (NpgsqlConnection, string) TryCreateConnection(IConfigurationSection section, Dictionary<string, string> passwords)
        {
            NpgsqlConnection connection;
            string connectionString;
            try
            {
                connectionString = section.Value;
                var builder = new NpgsqlConnectionStringBuilder(connectionString)
                {
                    ApplicationName = Program.Settings.ConnectionApplicationName, Pooling = false
                };
                if (string.IsNullOrEmpty(builder.Password))
                {
                    Console.WriteLine();
                    Console.Write("Password for: {0}: ", section.Key);
                    builder.Password = GetPasswordFromConsole();
                }
                else
                {
                    if (passwords.ContainsKey(builder.Password))
                    {
                        builder.Password = passwords[builder.Password];
                    }
                }
                connectionString = builder.ToString();
                connection = new NpgsqlConnection(connectionString);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);

                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Failed initialize connection \"{0}\", it might not be PostgreSQL connection. Skipping...", section.Key);
                Console.WriteLine("Error: {0}", e.Message);
                Console.ResetColor();
                return (null, null);
            }
            return (connection, connectionString);
        }

        private static Dictionary<string, string> GetPasswordDict(IConfiguration configuration)
        {
            var passwords = configuration.GetSection("Passwords").GetChildren().ToDictionary(s => s.Key, s => s.Value);
            foreach (var key in passwords.Keys.ToArray())
            {
                if (!string.IsNullOrEmpty(passwords[key])) continue;

                Console.WriteLine();
                Console.Write("Password for: {0}: ", key);
                passwords[key] = GetPasswordFromConsole();
            }

            return passwords;
        }

        private static string GetPasswordFromConsole()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            var pass = "";
            
            do
            {
                var key = Console.ReadKey(true);
                // Backspace Should Not Work
                if (key.Key != ConsoleKey.Backspace && key.Key != ConsoleKey.Enter)
                {
                    pass += key.KeyChar;
                    Console.Write("*");
                }
                else
                {
                    if (key.Key == ConsoleKey.Backspace && pass.Length > 0)
                    {
                        pass = pass.Substring(0, (pass.Length - 1));
                        Console.Write("\b \b");
                    }
                    else if (key.Key == ConsoleKey.Enter)
                    {
                        break;
                    }
                }
            } while (true);

            Console.ResetColor();
            return pass;
        }

        private static void ReleaseUnmanagedResources(SQLiteConnection localConnection)
        {
            foreach (var (_, data) in _connections)
            {
                if (data.Connection.State != ConnectionState.Closed)
                {
                    data.Connection.Close();
                }
                data.Connection.Dispose();
            }
            foreach (var (_, data) in WorkspaceConnections)
            {
                if (data.Connection.State != ConnectionState.Closed)
                {
                    data.Connection.Close();
                }
                data.Connection.Dispose();
                data.CleanupWs(localConnection, false);
            }
        }
    }
}
