using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Norm.Extensions;
using Npgsql;
using Pgcode.Migrations;

namespace Pgcode
{
    public sealed partial class ConnectionManager : IDisposable
    {
        private static ImmutableDictionary<string, ConnectionData> _connections;

        public static bool Initialize(IConfiguration configuration)
        {
            var connections = new Dictionary<string, ConnectionData>();
            var visible = Console.CursorVisible;
            Console.CursorVisible = false;

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
                int? schemaVersion;
                string serverVersion;
                try
                {
                    connection.Open();
                    Console.ResetColor();
                    Console.Write(" ... ");
                    Console.ForegroundColor = ConsoleColor.Green;
                    int availableVersion;
                    (schemaVersion, availableVersion) = migrations.GetSchemaVersions();
                    serverVersion = connection.ServerVersion;
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
                                "No migration applied for connection {0}, latest available is {1}. Some features may not be available.",
                                section.Key, availableVersion);
                        }
                        else
                        {
                            Console.WriteLine("Some migrations appear to be missing for connection {0}.", section.Key);
                            Console.WriteLine("Current schema version is {0}, latest available is {1}. Some features may not be available.",
                                schemaVersion, availableVersion);
                        }
                        Console.WriteLine("Run --schema-upgrade parameter to apply latest schema version.");
                    }
                    Console.ResetColor();
                }
                catch (Exception e)
                {
                    Console.ResetColor();
                    Console.Write(" ... ");
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("failed: {0}", e.Message);
                    Console.ResetColor();
                    continue;
                }
                finally
                {
                    connection.Close();
                }

                connections.Add(section.Key, new ConnectionData
                {
                    Connection = connection,
                    Name = section.Key,
                    SchemaVersion = schemaVersion,
                    ServerVersion = serverVersion
                });
                
            }

            Console.WriteLine();
            Console.CursorVisible = visible;
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
                if (string.IsNullOrEmpty(passwords[key]))
                {
                    Console.WriteLine();
                    Console.Write("Password for: {0}: ", key);
                    passwords[key] = GetPasswordFromConsole();
                }
            }

            return passwords;
        }

        private static string GetPasswordFromConsole()
        {
            var visible = Console.CursorVisible;
            Console.CursorVisible = true;
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

            Console.CursorVisible = visible;
            Console.ResetColor();
            return pass;
        }

        private static void ReleaseUnmanagedResources()
        {
            foreach (var (_, data) in _connections)
            {
                data.Connection.EnsureIsClose();
            }
        }
    }
}
