using Npgsql;

namespace Pgcode.Migrations._1.Routines
{
    public class ApiGetScriptContent : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "api_get_script_content";
        public const string CommentMarkup = @"

        Returns json object with script content and viewState.
        Params:
        - _data->>'id' - script id
        - _data->>'schema' - schema name or null for all schemas

        ";

        public ApiGetScriptContent(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
            select coalesce(
                (select json_build_object(
                    'content', content, 
                    'viewState', view_state
                )
                from
                    {settings.PgCodeSchema}.scripts
                where
                    (id = (_data->>'id')::bigint)), 
                (select json_build_object('content', '', 'viewState', null))
            );
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