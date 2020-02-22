using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class ApiGetSchema : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "api_get_schema";

        public static readonly string CommentMarkup = $@"

        Returns json object with elements:
        - scripts (value from `{SelectScripts.Name}`)
        - tables (value from `{SelectTables.Name}`)
        - views (value from `{SelectTables.Name}`)
        - routines (value from `{GetRoutines.Name}`)

        Params:
        -  `_data->'scripts'` - `select_scripts` params
        -  `_data->'tables'` - `{SelectTables.Name}` params
        -  `_data->'views'` - `{SelectTables.Name}` params
        -  `_data->'routines'` - `{GetRoutines.Name}` params

        ";

        public ApiGetSchema(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
            select json_build_object(
                'scripts', (
                    select {settings.PgCodeSchema}.{SelectScripts.Name}(_data->'scripts')
                ),
                'tables', (
                    select {settings.PgCodeSchema}.{SelectTables.Name}(_data->'tables')
                ),
                'views', (
                    select {settings.PgCodeSchema}.{SelectTables.Name}(_data->'views')
                ),
                'routines', (
                    select {settings.PgCodeSchema}.{GetRoutines.Name}(_data->'routines')
                ),
                'name', _data->>'name'
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