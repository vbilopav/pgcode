using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Norm.Extensions;
using Norm.Extensions.PostgreSQL;
using Npgsql;
using Npgsql.TypeHandlers.NetworkHandlers;

namespace Pgcode.Migrations
{
    public class MigrationRunnerException : Exception
    {
        public int Version { get; }
        public PostgresException PostgresException { get; }
        public MigrationRunnerException(int version, PostgresException exception)
        {
            Version = version;
            PostgresException = exception;
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

            if (!_connection.TableExists("schema_version", _settings.PgCodeSchema))
            {
                return null;
            }

            return _connection.Single<int>("select version from schema_version");
        }

        public int AvailableSchemaVersion() => _migrations.Keys.Max();

        public static int SchemaVersion() => new MigrationRunner(null, null).AvailableSchemaVersion();

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
                    throw new MigrationRunnerException(key, e);
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
                    throw new MigrationRunnerException(key, e);
                }
            }
        }
    }
}
