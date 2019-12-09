using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Pgcode.DataAccess.Extensions;

namespace Pgcode
{
    public sealed class ConnectionManager : IDisposable
    {
        private static ImmutableDictionary<string, NpgsqlConnection> _connections;

        public static void Initialize(IConfiguration configuration)
        {
            var connections = new Dictionary<string, NpgsqlConnection>();
            var visible = Console.CursorVisible;
            Console.CursorVisible = false;

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
                    connection = InitializeConnection(section.Value, section.Key);
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
            _connections = connections.ToImmutableDictionary();
        }

        private static NpgsqlConnection InitializeConnection(string connectionString, string name)
        {
            var builder = new NpgsqlConnectionStringBuilder(connectionString);
            if (string.IsNullOrEmpty(builder.Password))
            {
                Console.WriteLine();
                Console.Write("Password for: {0}: ", name);
                builder.Password = GetPasswordFromConsole();
            }
            var connection = new NpgsqlConnection(builder.ToString());
            try
            {
                connection.Open();
                // Initialize schema
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
                    Console.Write(" ");
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

        public ConnectionManager()
        {
        }

        public void Dispose()
        {
            ReleaseUnmanagedResources();
            GC.SuppressFinalize(this);
        }

        ~ConnectionManager()
        {
            ReleaseUnmanagedResources();
        }
    }
}
