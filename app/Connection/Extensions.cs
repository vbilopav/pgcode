using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Norm.Extensions;
using Npgsql;
using NpgsqlTypes;

namespace Pgcode.Connection
{
    public static class Extensions
    {
        public static async ValueTask<T> GetSingleItemFromCloneAsync<T>(this ConnectionData data, string name, object parameters)
        {
            var (command, dataParam) = GetCommand(data, name, parameters);
            await using var connection = data.Connection.CloneWith(data.ConnectionString);
            return await data.Connection
                .Prepared()
                .AsProcedure()
                .SingleAsync<T>(command, GetParam(dataParam));
        }
/*
        public static string LockAndGetString<T>(this ConnectionData data, string name, T parameters)
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
*/
        private static (string command, string dataParam) GetCommand(ConnectionData data, string name, object parameters)
        {
            var command = $"{Program.Settings.PgCodeSchema}.{name}";
            var dataParam = parameters is string str ? str : JsonSerializer.Serialize(parameters);

            if (data.Logger == null || !Program.Settings.LogPgCodeDbCommands)
            {
                return (command, dataParam);
            }
            var msg = $"select {command}('{dataParam}'::json){Environment.NewLine}";
            data.Logger.LogInformation(msg);
            return (command, dataParam);
        }

        private static NpgsqlParameter GetParam(string value) => 
            new NpgsqlParameter(Program.Param, NpgsqlDbType.Json) { Value = value };
    }
}