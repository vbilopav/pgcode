using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using Npgsql;
using Pgcode.DataAccess.Extensions;

namespace Pgcode.Migrations
{
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

        public void Up()
        {
            foreach (var key in _migrations.Keys.OrderBy(v => v).ToArray())
            {
                var migration = _migrations[key];
                _connection.Execute(migration.Up(_settings));
            }
        }

        public void Down()
        {
            foreach (var key in _migrations.Keys.OrderByDescending(v => v).ToArray())
            {
                var migration = _migrations[key];
                _connection.Execute(migration.Down(_settings));
            }
        }
    }
}
