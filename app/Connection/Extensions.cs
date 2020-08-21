﻿using System;
using System.Data;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
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
            await connection.OpenAsync();
            return await connection.FunctionSingleAsync<T>(command, GetParam(dataParam));
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static Task<int> ExecuteAsync(this NpgsqlCommand cmd, string command, CancellationToken cancellationToken = default)
        {
            cmd.CommandText = command;
            return cmd.ExecuteNonQueryAsync(cancellationToken);
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static int Execute(this NpgsqlCommand cmd, string command)
        {
            cmd.CommandText = command;
            return cmd.ExecuteNonQuery();
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static Task<NpgsqlDataReader> ReaderAsync(this NpgsqlCommand cmd, string command, CancellationToken cancellationToken = default)
        {
            cmd.CommandText = command;
            return cmd.ExecuteReaderAsync(cancellationToken);
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static NpgsqlDataReader Reader(this NpgsqlCommand cmd, string command, NpgsqlParameter param1 = null)
        {
            cmd.CommandText = command;
            if (param1 != null)
            {
                cmd.Parameters.Add(param1);
            }
            return cmd.ExecuteReader();
        }

        public static async ValueTask<T> SingleAsync<T>(this NpgsqlCommand cmd, string command, CancellationToken cancellationToken = default)
        {
            await using var reader = await cmd.ReaderAsync(command, cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return reader.GetFieldValue<T>(0);
            }
            return default;
        }

        public static T Single<T>(this NpgsqlCommand cmd, string command, NpgsqlParameter param1 = null)
        {
            using var reader = cmd.Reader(command, param1);
            if (reader.Read())
            {
                return reader.GetFieldValue<T>(0);
            }
            return default;
        }

        public static bool Any(this NpgsqlCommand cmd, string command)
        {
            using var reader = cmd.Reader(command);
            return reader.Read();
        }

        public static async ValueTask<T> FunctionSingleAsync<T>(this NpgsqlConnection connection, string command, NpgsqlParameter param1 = null)
        {
            await using var cmd = connection.CreateCommand();
            cmd.CommandType = CommandType.StoredProcedure;
            if (param1 != null)
            {
                cmd.Parameters.Add(param1);
            }
            return await cmd.SingleAsync<T>(command);
        }

        public static string Format(this TimeSpan ts) => ts.ToString("hh':'mm':'ss'.'fff");

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