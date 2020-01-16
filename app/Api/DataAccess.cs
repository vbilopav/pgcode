using System;
using System.Collections.Generic;
using System.Linq;
using Norm.Extensions;
using Npgsql;

namespace Pgcode.Api
{
    public class DataAccessException : Exception
    {
        public DataAccessException(string message) : base(message) { }

        public DataAccessException(string message, Exception innerException) : base(message, innerException) { }
    }

    public class DataAccess
    {
        private readonly Settings _settings;
        private readonly ConnectionManager _connectionManager;
        private NpgsqlConnection _connection;

        public DataAccess(Settings settings, ConnectionManager connectionManager)
        {
            _settings = settings;
            _connectionManager = connectionManager;
        }

        public DataAccess For(string name)
        {
            _connection = _connectionManager.GetConnection(name);
            if (_connection == null)
            {
                throw new DataAccessException($"Connection {name} doesn't exist.");
            }
            return this;
        }

        public IEnumerable<string> GetSchemas() => _connection.Read<string>(@"
            select
                schema_name 
            from
                information_schema.schemata
        ").Where(s =>
        {
            foreach (var skip in _settings.SkipSchemaStartingWith)
            {
                if (s.StartsWith(skip))
                {
                    return false;
                };
            }
            return true;
        });

        public string GetSelectedSchema(string user) => _connection.Single<string>($@"
            select 
                data->>'schema'
            from 
                {_settings.PgCodeSchema}.users 
            where 
                id = @user", user) ?? _settings.DefaultSchema;
    }
}
