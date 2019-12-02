using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Pgcode
{
    public class ConnectionManager
    {
        private static NpgsqlConnection _connection;

        public static async ValueTask TryConnection(Settings settings, IConfiguration configuration)
        {
            if (string.IsNullOrEmpty(settings.Connection))
            {
                //
            }

            var connectionString = configuration.GetConnectionString(settings.Connection);
            if (string.IsNullOrEmpty(connectionString))
            {
                //
            }

            _connection = new NpgsqlConnection(connectionString);
            //_connection.CloneWith()
            await _connection.OpenAsync();
        }
    }
}
