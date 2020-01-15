using System;
using System.Collections.Generic;
using Norm.Extensions;
using Npgsql;

namespace Pgcode.Api
{
    public class DataAccess
    {
        private readonly Settings _settings;
        private readonly ConnectionManager _connectionManager;

        private string _user;
        private NpgsqlConnection _connection;

        public DataAccess(Settings settings, ConnectionManager connectionManager)
        {
            _settings = settings;
            _connectionManager = connectionManager;
        }

        public DataAccess ForUser(string user)
        {
            _user = user;
            _connection = _connectionManager.GetConnection(user);
            return this;
        }

        public IEnumerable<string> GetSchemas() => _connection.Read<string>(@"
            select
                schema_name 
            from
                information_schema.schemata
        ");

        public string GetSelectedSchema() => _connection.Single<string>($@"
            select 
                data->>'schema'
            from 
                {_settings.PgCodeSchema}.users 
            were 
                id = @user", _user) ?? "public";
    }
}
