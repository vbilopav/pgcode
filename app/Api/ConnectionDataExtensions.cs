using System;
using System.Globalization;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Norm.Extensions;
using Npgsql;

namespace Pgcode.Api
{
    public static class ConnectionDataExtensions
    {
        public static async ValueTask<string> GetStringAsync<T>(this ConnectionData data, string name, T parameters)
        {
            var (command, dataParam) = GetCommand(data, name, parameters);
            return await data.Connection.SingleAsync<string>(command, dataParam);
        }

        public static async ValueTask VoidAsync<T>(this ConnectionData data, string name, T parameters)
        {
            var (command, dataParam) = GetCommand(data, name, parameters);
            await data.Connection.ExecuteAsync(command, dataParam);
        }

        public static async ValueTask<ContentResult> GetContentResultAsync<T>(this ConnectionData data, string name, T parameters)
        {
            return new ContentResult
            {
                StatusCode = 200,
                Content = await data.GetStringAsync(name, parameters),
                ContentType = "application/javascript; charset=UTF-8"
            };
        }

        private static (string command, string dataParam) GetCommand<T>(ConnectionData data, string name, T parameters)
        {
            var command = $"select {Program.Settings.PgCodeSchema}.{name}(@_data::json)";
            var dataParam = JsonSerializer.Serialize(parameters);

            if (data.Logger != null && Program.Settings.LogPgCodeDbCommands)
            {
                var msg = $"{command.Replace("@_data", $"'{dataParam}'")}{Environment.NewLine}";
                data.Logger.LogInformation(msg);
            }
            return (command, dataParam);
        }
    }
}