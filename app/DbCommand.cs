using System;
using System.Data.Common;
using Npgsql;

namespace Pgcode
{
    public static class DbCommand
    {
        public static int Execute(this NpgsqlCommand cmd, string command, NpgsqlParameter param1)
        {
            cmd.CommandText = command;
            cmd.Parameters.Add(param1);
            return cmd.ExecuteNonQuery();
        }

        public static int Execute(this System.Data.Common.DbCommand cmd, string command)
        {
            cmd.CommandText = command;
            return cmd.ExecuteNonQuery();
        }

        public static NpgsqlDataReader Reader(this NpgsqlCommand cmd, string command, NpgsqlParameter param1)
        {
            cmd.CommandText = command;
            cmd.Parameters.Add(param1);
            return cmd.ExecuteReader();
        }

        public static DbDataReader Reader(this System.Data.Common.DbCommand cmd, string command)
        {
            cmd.CommandText = command;
            return cmd.ExecuteReader();
        }

        public static T Single<T>(this NpgsqlCommand cmd, string command)
        {
            using var reader = cmd.Reader(command);
            return reader.Read() ? reader.GetFieldValue<T>(0) : default;
        }

        public static bool Any(this NpgsqlCommand cmd, string command)
        {
            using var reader = cmd.Reader(command);
            return reader.Read();
        }

        public static string Format(this TimeSpan ts) => ts.ToString("hh':'mm':'ss'.'fff");
    }
}