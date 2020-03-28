using Npgsql;

namespace Pgcode.Migrations._1.Routines
{
    public class IdGenerator : IMigration
    {
        private const string Seq = "global_id_sequence";
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "id_generator";

        public static readonly string CommentMarkup = "generates unique id";

        public IdGenerator(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create sequence if not exists {settings.PgCodeSchema}.{Seq};

        create or replace function {settings.PgCodeSchema}.{Name}(out _result bigint) as
        ${Name}$
        declare
            _our_epoch bigint := 1314220021721;
            _seq_id bigint;
            _now_millis bigint;
            _shard_id int := 1;
        begin

            select nextval('pgcode.global_id_sequence') % 1024 into _seq_id;

            select floor(extract(epoch from clock_timestamp()) * 1000) into _now_millis;
            _result := (_now_millis - _our_epoch) << 23;
            _result := _result | (_shard_id << 10);
            _result := _result | (_seq_id);
            
        end
        ${Name}$
        language plpgsql security definer stable;
        comment on function {settings.PgCodeSchema}.{Name}() is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;
        revoke all on function {settings.PgCodeSchema}.{Name}() from public;
        grant execute on function {settings.PgCodeSchema}.{Name}() to {connection.UserName};
        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        drop function if exists {settings.PgCodeSchema}.{Name}();
        drop sequence if exists {settings.PgCodeSchema}.{Seq};
        
        ");
    }
}