using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Pgcode.DataAccess.Extensions;
using Pgcode.Migrations;

namespace Pgcode
{
    public sealed partial class ConnectionManager : IDisposable
    {
        private static ImmutableDictionary<string, NpgsqlConnection> _connections;

        public static bool Initialize(IConfiguration configuration)
        {
            var connections = new Dictionary<string, NpgsqlConnection>();
            var visible = Console.CursorVisible;
            Console.CursorVisible = false;

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
                NpgsqlConnection connection;
                try
                {
                    connection = InitializeConnection(section.Value, section.Key, passwords);
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
                connections.Add(section.Key, connection);
                Console.ResetColor();
                Console.Write(" ... ");
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("success");
                Console.ResetColor();
            }
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

        private static NpgsqlConnection InitializeConnection(string connectionString, string name, IDictionary<string, string> passwords)
        {
            var builder = new NpgsqlConnectionStringBuilder(connectionString);
            if (string.IsNullOrEmpty(builder.Password))
            {
                Console.WriteLine();
                Console.Write("Password for: {0}: ", name);
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
            try
            {
                connection.Open();
                Console.ForegroundColor = ConsoleColor.Yellow;
                if (Program.IsDebug)
                {
                    connection.Notice += (sender, args) =>
                    {
                        Console.WriteLine();
                        Console.WriteLine(args.Notice.MessageText);
                    };
                }
                new MigrationRunner(connection, Program.Settings).Up();
                Console.ResetColor();

                return connection;
            }
            finally
            {
                connection.Close();
            }
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
            foreach (var (_, connection) in _connections)
            {
                connection.EnsureIsClose();
            }
        }
    }
}
