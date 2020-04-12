using System;
using System.Data;
using System.Text.Json;
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
        public static async ValueTask<string> GetStringAsync<T>(this ConnectionData data, string name, T parameters)
        {
            var (command, dataParam) = GetCommand(data, name, parameters);
            return await data.Connection
                .AsProcedure()
                .SingleAsync<string>(command, new NpgsqlParameter("_data", NpgsqlDbType.Json) { Value = dataParam });
        }

        public static async ValueTask ExecAsync<T>(this ConnectionData data, string name, T parameters)
        {
            var (command, dataParam) = GetCommand(data, name, parameters);
            await data.Connection
                .AsProcedure()
                .ExecuteAsync(command, new NpgsqlParameter("_data", NpgsqlDbType.Json) { Value = dataParam });
        }

        public static void Exec<T>(this ConnectionData data, string name, T parameters)
        {
            var (command, dataParam) = GetCommand(data, name, parameters);
            data.Connection
                .AsProcedure()
                .Execute(command, new NpgsqlParameter("_data", NpgsqlDbType.Json) { Value = dataParam });
        }

        public static async ValueTask<ContentResult> GetContentResultAsync<T>(this ConnectionData data, string name, T parameters) =>
            new ContentResult
            {
                StatusCode = 200,
                Content = await data.GetStringAsync(name, parameters),
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