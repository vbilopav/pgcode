using Npgsql;

namespace Pgcode.Migrations._1.Routines
{
    public class MaxStr : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "maxstr";
        public const string CommentMarkup = @"

        returns first n (second param, 80 is default) chars of a string with ... if it is longer and trims for new lines and spaces

        ";

        public MaxStr(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(t text, l integer = 160) returns text
        language sql cost 1 immutable strict parallel safe as
        ${Name}$select trim(trim(trim(substring(t from 1 for l) || case when char_length(t) > l then '...' else '' end), E'\n'))${Name}$;
        comment on function {settings.PgCodeSchema}.{Name}(text, integer) is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;
        revoke all on function {settings.PgCodeSchema}.{Name}(text, integer) from public;
        grant execute on function {settings.PgCodeSchema}.{Name}(text, integer) to {connection.UserName};

        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        drop function if exists {settings.PgCodeSchema}.{Name}(text, integer);

        ");
    }
}