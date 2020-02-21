using System;
using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class ApiGetWorkspaceForConnection : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "api_get_workspace_for_connection";

        public static readonly string CommentMarkup = $@"

        Returns json object with elements:
        - schemas (selected schema name and names from `{SelectInformationSchemaSchemata.Name}`)
        - scripts (value from `{SelectScripts.Name}`)
        - tables (value from `{SelectInformationSchemaTables.Name}`)
        - views (value from `{SelectInformationSchemaTables.Name}`)
        - routines (value from `{SelectInformationSchemaRoutines.Name}`)

        Params:
        -  `_data->'schemata'` - `{SelectInformationSchemaSchemata.Name}` params
        -  `_data->'scripts'` - `{SelectScripts.Name}` params
        -  `_data->'tables'` - `{SelectInformationSchemaTables.Name}` params
        -  `_data->'views'` - `{SelectInformationSchemaTables.Name}` params
        -  `_data->'routines'` - `{SelectInformationSchemaRoutines.Name}` params

        ";

        public ApiGetWorkspaceForConnection(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json)
        returns json as
        ${Name}$
            select json_build_object(
                'schemas', json_build_object(
                    'names', (
                        select {settings.PgCodeSchema}.{SelectInformationSchemaSchemata.Name}(_data->'schemata')
                    ),
                    'selected', _data->'schemata'->>'schema'
                ),
                'scripts', (
                    select {settings.PgCodeSchema}.{SelectScripts.Name}(_data->'scripts')
                ),
                'tables', (
                    select {settings.PgCodeSchema}.{SelectInformationSchemaTables.Name}(_data->'tables')
                ),
                'views', (
                    select {settings.PgCodeSchema}.{SelectInformationSchemaTables.Name}(_data->'views')
                ),
                'routines', (
                    select {settings.PgCodeSchema}.{SelectInformationSchemaRoutines.Name}(_data->'routines')
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