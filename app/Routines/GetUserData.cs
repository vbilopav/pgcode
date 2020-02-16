using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class GetUserData : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "get_user_data";
        public const string CommentMarkup = @"
        
        Return user profile value by `key` and `userId`.

        Params:
        - _data->>'key' - profile key
        - _data->>'userId' - user id

        ";

        public GetUserData(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns text as
        ${Name}$
            select 
                data->>(_data->>'key')
            from 
                {settings.PgCodeSchema}.users 
            where 
                id = _data->>'userId';
        ${Name}$
        language sql security definer stable;
        comment on function {settings.PgCodeSchema}.{Name}(json) is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;
        revoke all on function {settings.PgCodeSchema}.{Name}(json) from public;
        grant execute on function {settings.PgCodeSchema}.{Name}(json) to {connection.UserName};

        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        drop function if exists {settings.PgCodeSchema}.{Name}(_data json);

        ");
    }
}