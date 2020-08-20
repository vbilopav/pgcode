using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Npgsql;
using Pgcode.Migrations._1;
using Pgcode.Connection;

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
            using var cmd = _connection.CreateCommand();
            cmd.Execute($"set search_path to {_settings.PgCodeSchema}");
            var schema = cmd.Single<string>("select current_schema()");

            if (schema == null)
            {
                return null;
            }
            using var reader = cmd.Reader(@"select 1
                from
                    information_schema.tables
                where
                    table_name = 'schema_version' and table_schema = @schema",
                new NpgsqlParameter{Value = _settings.PgCodeSchema, ParameterName = "schema"});

            if (!reader.Read())
            {
                return null;
            }
            reader.Close();
            return cmd.Single<int>("select version from schema_version");
        }

        public int AvailableSchemaVersion() => _migrations.Keys.Max();

        public static int SchemaVersion() => new MigrationRunner(null, null).AvailableSchemaVersion();

        public (int?, int) GetSchemaVersions() => (CurrentSchemaVersion(), AvailableSchemaVersion());

        public void Up(int? upToVersion, bool routinesOnly = false)
        {
            using var cmd = _connection.CreateCommand();
            foreach (var key in _migrations.Keys.OrderBy(v => v))
            {
                if (upToVersion != null && key > upToVersion)
                {
                    return;
                }
                var migration = _migrations[key];
                try
                {
                    cmd.Execute(!routinesOnly
                        ? migration.Up(_settings, _connection)
                        : string.Join(Environment.NewLine,
                            migration.Routines.Select(m => m.Up(_settings, _connection))));
                }
                catch (PostgresException e)
                {
                    throw new MigrationRunnerException(key, e);
                }
            }
        }

        public void Down(int? downToVersion, bool routinesOnly = false)
        {
            using var cmd = _connection.CreateCommand();
            foreach (var key in _migrations.Keys.OrderByDescending(v => v))
            {
                if (downToVersion != null && key < downToVersion)
                {
                    return;
                }
                var migration = _migrations[key];
                try
                {
                    cmd.Execute(!routinesOnly
                        ? migration.Down(_settings, _connection)
                        : string.Join(Environment.NewLine,
                            migration.Routines.Select(m => m.Down(_settings, _connection))));
                }
                catch (PostgresException e)
                {
                    throw new MigrationRunnerException(key, e);
                }
            }
        }
    }
}
