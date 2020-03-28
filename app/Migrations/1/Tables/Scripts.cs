using Npgsql;

namespace Pgcode.Migrations._1.Tables
{
    public class Scripts : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "scripts";
        public const string CommentMarkup = "pgcode scripts content";

        public Scripts(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create table {settings.PgCodeSchema}.{Name} (
            id int not null generated always as identity primary key,
            user_id varchar not null,
            title varchar not null,
            schema varchar null,
            comment text null,
            content text not null default '',
            view_state json null,
            timestamp timestamp with time zone not null default transaction_timestamp()
        );
        
        create index IDX_scripts_user_id on {settings.PgCodeSchema}.{Name} using btree (user_id);

        comment on table {settings.PgCodeSchema}.{Name} is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;

        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        drop table if exists {settings.PgCodeSchema}.{Name};

        ");
    }
}