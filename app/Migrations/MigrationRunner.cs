using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using Norm.Extensions;
using Npgsql;

namespace Pgcode.Migrations
{
    public class MigrationRunnerException : Exception
    {
        public MigrationRunnerException(string message) : base(message)
        {
        }
    }

    public class MigrationRunner
    {
        private readonly NpgsqlConnection _connection;
        private readonly Settings _settings;

        private readonly IDictionary<int, IMigration> _migrations = new Dictionary<int, IMigration>
        {
            {1, new Migration1()}

        }.ToImmutableDictionary();

        public MigrationRunner(NpgsqlConnection connection, Settings settings)
        {
            _connection = connection;
            _settings = settings;
        }

        public int? CurrentSchemaVersion()
        {
            var schema = _connection
                .Execute($"set search_path to {_settings.PgCodeSchema}")
                .Single<string>("select current_schema()");

            if (schema == null)
            {
                return null;
            }

            if (_connection.Single(@"
                select 1 
                from 
                    information_schema.tables
                where 
                    table_schema = @schema and table_name = @table", 
                    _settings.PgCodeSchema, "schema_version").Count == 0)
            {
                return null;
            }

            return _connection.Single<int>("select version from schema_version");
        }

        public int AvailableSchemaVersion() => _migrations.Keys.Max();

        public (int?, int) GetSchemaVersions() => (CurrentSchemaVersion(), AvailableSchemaVersion());

        public void Up(int? upToVersion = null)
        {
            foreach (var key in _migrations.Keys.OrderBy(v => v))
            {
                if (upToVersion != null && key > upToVersion)
                {
                    return;
                }
                var migration = _migrations[key];
                try
                {
                    _connection.Execute(migration.Up(_settings));
                }
                catch (PostgresException e)
                {
                    throw new MigrationRunnerException($"Failed to apply up migration version {key}. Error: {e.MessageText}");
                }
            }
        }

        public void Down(int? downToVersion = null)
        {
            foreach (var key in _migrations.Keys.OrderByDescending(v => v))
            {
                if (downToVersion != null && key < downToVersion)
                {
                    return;
                }
                var migration = _migrations[key];
                try
                {
                    _connection.Execute(migration.Down(_settings));
                }
                catch (PostgresException e)
                {
                    throw new MigrationRunnerException($"Failed to apply down migration version {key}. Error: {e.MessageText}");
                }
            }
        }
    }
}
