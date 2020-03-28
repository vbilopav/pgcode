using Npgsql;

namespace Pgcode.Migrations._1.Tables
{
    public class Users : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "users";
        public const string CommentMarkup = "pgcode application users";

        public Users(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"
       
        create table {settings.PgCodeSchema}.{Name} (
            id varchar not null primary key,
            data jsonb not null default '{{}}',
            timestamp timestamp with time zone not null default transaction_timestamp()
        );

        comment on table {settings.PgCodeSchema}.{Name} is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;

        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        drop table if exists {settings.PgCodeSchema}.{Name};

        ");
    }
}