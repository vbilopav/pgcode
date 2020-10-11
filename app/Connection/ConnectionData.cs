using System;
using System.Data;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Npgsql;
using NpgsqlTypes;

namespace Pgcode.Connection
{
    public class ConnectionData
    {
        public int? SchemaVersion { get; set; }
        public string ServerVersion { get; set; }
        public string Name { get; set; }
        public NpgsqlConnection Connection { get; set; }
        public string ConnectionString { get; set; }
        public ILogger Logger { get; set; }
    }

    public static class ConnectionDataExtensions
    {
        public static T GetSingleItemFromClone<T>(this ConnectionData data, string name, object parameters)
        {
            var (command, dataParam) = GetCommand(data, name, parameters);
            using var connection = data.Connection.CloneWith(data.ConnectionString);
            connection.Open();
            return connection.FunctionSingle<T>(command, GetParam(dataParam));
        }

        public static T FunctionSingle<T>(this NpgsqlConnection connection, string command, NpgsqlParameter param1 = null)
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandType = CommandType.StoredProcedure;
            if (param1 != null)
            {
                cmd.Parameters.Add(param1);
            }
            return cmd.Single<T>(command);
        }

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

        private static NpgsqlParameter GetParam(string value) => new NpgsqlParameter(Program.Param, NpgsqlDbType.Json) { Value = value };
    }
}