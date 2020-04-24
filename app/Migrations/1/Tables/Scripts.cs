using Npgsql;
using Pgcode.Migrations._1.Routines;

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

        create sequence if not exists {settings.PgCodeSchema}.{Name}_id_seq;

        create table {settings.PgCodeSchema}.{Name} (
            id int not null primary key default nextval('{settings.PgCodeSchema}.{Name}_id_seq'),
            user_id varchar not null,
            title varchar not null,
            schema varchar null,
            comment text null,
            content text not null default '',
            view_state json null,
            scroll_position json null,
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