using System;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Norm.Extensions;
using Npgsql;
using NpgsqlTypes;
using Pgcode.ApiModels;

namespace Pgcode.Api
{
    public static class Extensions
    {
        public static string GetString<T>(this ConnectionData data, string name, T parameters)
        {
            var (command, dataParam) = GetCommand(data, name, parameters);
            lock (data.Connection)
            {
                return data.Connection
                    .Prepared()
                    .AsProcedure()
                    .Single<string>(command, GetParam(dataParam));
            }
        }

        public static void Execute<T>(this ConnectionData data, string name, T parameters)
        {
            var (command, dataParam) = GetCommand(data, name, parameters);
            lock (data.Connection)
            {
                data.Connection
                    .Prepared()
                    .AsProcedure()
                    .Execute(command, GetParam(dataParam));
            }
        }

        public static ContentResult GetContentResult<T>(this ConnectionData data, string name, T parameters) =>
            new ContentResult
            {
                StatusCode = 200,
                Content = data.GetString(name, parameters),
                ContentType = Strings.JsonContentType
            };

        public static bool ContainsHeader(this HttpRequest request, string name) => 
            request.Headers.Contains(new KeyValuePair<string, StringValues>(name, "1"));

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

        private static NpgsqlParameter GetParam(string value) => 
            new NpgsqlParameter(Strings.Param, NpgsqlDbType.Json) { Value = value };
    }
}