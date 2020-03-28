using Npgsql;

namespace Pgcode.Migrations._1.Tables
{
    public class SchemaVersion : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "schema_version";
        public const string CommentMarkup = "applied migrations history";

        public SchemaVersion(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"
       
        create table if not exists {settings.PgCodeSchema}.{Name} (
            version int not null primary key,
            timestamp timestamp with time zone not null default transaction_timestamp()
        );

        comment on table {settings.PgCodeSchema}.{Name} is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;

        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        drop table if exists {settings.PgCodeSchema}.{Name};

        ");
    }
}