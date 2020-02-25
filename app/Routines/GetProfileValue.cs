using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class GetProfileValue : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "get_profile_value";
        public const string CommentMarkup = @"
        
        Return user profile value
        Params:
        - `key`
        - `user_id`
        ";

        public GetProfileValue(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"
        create or replace function {settings.PgCodeSchema}.{Name}(_user_id varchar, _key varchar) returns text as
        ${Name}$
            select 
                data->>(_key)
            from 
                {settings.PgCodeSchema}.users 
            where 
                id = _user_id;
        ${Name}$
        language sql security definer stable;
        comment on function {settings.PgCodeSchema}.{Name}(varchar, varchar) is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;
        revoke all on function {settings.PgCodeSchema}.{Name}(varchar, varchar) from public;
        grant execute on function {settings.PgCodeSchema}.{Name}(varchar, varchar) to {connection.UserName};
        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"
        drop function if exists {settings.PgCodeSchema}.{Name}(varchar, varchar);
        ");
    }
}