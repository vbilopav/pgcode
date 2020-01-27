using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Norm.Extensions;
using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Api
{
    public sealed partial class ConnectionManager
    {
        private static ImmutableDictionary<string, ConnectionData> _connections;
        private static readonly ConcurrentDictionary<string, string> ConnectionNamesByUserId = new ConcurrentDictionary<string, string>();

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

                var connection = CreateConnection(section, passwords);
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

                            RunMigrations(configuration, runner => runner.Up(), section.Key);
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

                                RunMigrations(configuration, runner => runner.Down(), section.Key);
                            }
                            else
                            {
                                Console.WriteLine("Some migrations appear to be missing for connection {0}.",
                                    section.Key);
                                Console.WriteLine(
                                    "Current schema version is {0}, latest available is {1}. Downgrading migrations now.",
                                    schemaVersion, availableVersion);

                                RunMigrations(configuration, runner => runner.Up(), section.Key);
                            }

                            schemaVersion = availableVersion;
                        }
                    }
                    Console.ResetColor();

                    connections.Add(section.Key, new ConnectionData
                    {
                        Connection = connection,
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

        public static void MigrationsInfo(IConfiguration configuration, string forConnection = null)
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

        public static void MigrationsUp(IConfiguration configuration, int? upToVersion = null, string forConnection = null) =>
            RunMigrations(configuration, runner => runner.Up(upToVersion), forConnection);

        public static void MigrationsDown(IConfiguration configuration, int? downToVersion = null, string forConnection = null) =>
            RunMigrations(configuration, runner => runner.Down(downToVersion), forConnection);

        public static void AddNoticeHandlersToConnections(ILoggerFactory loggerFactory)
        {
            foreach (var (key, value) in _connections)
            {
                var logger = loggerFactory.CreateLogger(key);
                value.Connection.Notice += (sender, args) =>
                {
                    var severity = args.Notice.Severity;
                    if (InfoLevels.Contains(severity))
                    {
                        logger.LogInformation(args.Notice.MessageText);
                    }
                    else if (severity == "WARNING")
                    {
                        logger.LogWarning(args.Notice.MessageText);
                    }
                    else if (severity.StartsWith("DEBUG"))
                    {
                        logger.LogDebug(args.Notice.MessageText);
                    }
                    else if (ErrorLevels.Contains(severity))
                    {
                        logger.LogError(args.Notice.MessageText);
                    }
                    else
                    {
                        logger.LogTrace(args.Notice.MessageText);
                    }
                };
            }
        }

        private static readonly IEnumerable<string> InfoLevels = new[] { "INFO", "NOTICE", "LOG" };
        private static readonly IEnumerable<string> ErrorLevels = new[] { "ERROR", "PANIC" };

        private static void RunMigrations(IConfiguration configuration, Action<MigrationRunner> action, string forConnection = null)
        {
            var children = configuration.GetSection("ConnectionStrings").GetChildren().ToList();
            var passwords = GetPasswordDict(configuration);
            foreach (var section in children)
            {
                if (forConnection != null && section.Key != forConnection)
                {
                    continue;
                }
                var connection = CreateConnection(section, passwords);
                var migrations = new MigrationRunner(connection, Program.Settings);
                Console.ResetColor();
                Console.Write("Connection: ");
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
                        Console.WriteLine("Error: {0}", e.PostgresException.Message);
                        if (e.PostgresException.Detail != null)
                        {
                            Console.WriteLine("Detail: {0}", e.PostgresException.Detail);
                        }
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

        private static NpgsqlConnection CreateConnection(IConfigurationSection section, Dictionary<string, string> passwords)
        {
            var builder = new NpgsqlConnectionStringBuilder(section.Value);
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

            var connection = new NpgsqlConnection(builder.ToString());
            return connection;
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

        private static void ReleaseUnmanagedResources()
        {
            foreach (var (_, data) in _connections)
            {
                data.Connection.EnsureIsClose();
                data.Connection.Dispose();
            }
        }
    }
}
