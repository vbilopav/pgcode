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
            Console.Write("Initializing connections... ");
            var left = Console.CursorLeft;

            var children = configuration.GetSection("ConnectionStrings").GetChildren().ToList();
            var count = children.Count;
            int current = 0;
            foreach (var section in children)
            {
                Console.CursorLeft = left;
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.Write($"{current++} of {count}");
                Console.ForegroundColor = ConsoleColor.Green;
                Console.ResetColor();
                Console.Write(" - ");
                Console.Write($"{section.Key}{new string(' ', 15)}");
                var connection = InitializeConnection(configuration, section.Value);
                connections.Add(section.Key, connection);
            }
            Console.CursorLeft = left;
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"{current} of {count} Done!{new string(' ', 15)}");
            Console.ResetColor();
            Console.CursorVisible = visible;
            _connections = connections.ToImmutableDictionary();
        }

        private static NpgsqlConnection InitializeConnection(IConfiguration configuration, string connectionString)
        {
            var connection = new NpgsqlConnection(connectionString);
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
