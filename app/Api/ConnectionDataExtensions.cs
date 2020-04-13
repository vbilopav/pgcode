using System;
using System.Data;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Norm.Extensions;
using Npgsql;
using NpgsqlTypes;

namespace Pgcode.Api
{
    public static class ConnectionDataExtensions
    {
        public static string GetString<T>(this ConnectionData data, string name, T parameters)
        {
            lock (data.Connection)
            {
                var (command, dataParam) = GetCommand(data, name, parameters);
                return data.Connection
                    .AsProcedure()
                    .Single<string>(command, new NpgsqlParameter("_data", NpgsqlDbType.Json) {Value = dataParam});
            }

        }

        public static void Exec<T>(this ConnectionData data, string name, T parameters)
        {
            lock (data.Connection)
            {
                var (command, dataParam) = GetCommand(data, name, parameters);
                data.Connection
                    .AsProcedure()
                    .Execute(command, new NpgsqlParameter("_data", NpgsqlDbType.Json) { Value = dataParam });
            }
        }

        public static ContentResult GetContentResult<T>(this ConnectionData data, string name, T parameters) =>
            new ContentResult
            {
                StatusCode = 200,
                Content = data.GetString(name, parameters),
                ContentType = "application/javascript; charset=UTF-8"
            };

        private static (string command, string dataParam) GetCommand<T>(ConnectionData data, string name, T parameters)
        {
            var command = $"{Program.Settings.PgCodeSchema}.{name}";
            var dataParam = JsonSerializer.Serialize(parameters);

            if (data.Logger != null && Program.Settings.LogPgCodeDbCommands)
            {
                var msg = $"select {command}('{dataParam}'::json){Environment.NewLine}";
                data.Logger.LogInformation(msg);
            }
            return (command, dataParam);
        }
    }
}