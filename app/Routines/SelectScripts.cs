using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class SelectScripts : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "select_scripts";
        public const string CommentMarkup = @"

        Returns json array with script `id` and `name`
        

        Params:
        - _data->>'userId' - user id or null for all users
        - _data->>'schema' - schema name or null for all schemas

        ";

        public SelectScripts(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
            select coalesce(json_agg(result), '[]')
            from (
                select 
                    id,
                    title,
                    comment
                from 
                    {settings.PgCodeSchema}.scripts
                where
                    (_data->>'schema' is null or schema = _data->>'schema')
                    and
                    (_data->>'userId' is null or schema = _data->>'userId')
                order by
                    title
            ) as result;
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