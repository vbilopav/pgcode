using Npgsql;

namespace Pgcode.Migrations._1.Routines
{
    public class HashCode : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "hash_code";
        public const string CommentMarkup = @"

        return bigint hash code from string input

        ";

        public HashCode(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_input text) returns bigint
        language sql cost 1 immutable strict parallel safe as
        ${Name}$select ('x' || substr(md5(_input), 1, 16))::bit(64)::bigint${Name}$;
        comment on function {settings.PgCodeSchema}.{Name}(text) is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;
        revoke all on function {settings.PgCodeSchema}.{Name}(text) from public;
        grant execute on function {settings.PgCodeSchema}.{Name}(text) to {connection.UserName};

        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        drop function if exists {settings.PgCodeSchema}.{Name}(text);

        ");
    }
}