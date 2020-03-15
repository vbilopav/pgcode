using System;
using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class ApiGetConnection : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "api_get_connection";

        public static readonly string CommentMarkup = $@"

        Returns json object with elements:
        - schemas (selected schema name and names from `{SelectSchemata.Name}`)
        - scripts (value from `{SelectScripts.Name}`)
        - tables (value from `{SelectTables.Name}`)
        - views (value from `{SelectTables.Name}`)
        - routines (value from `{SelectRoutines.Name}`)
        Params:
        - `_data->>'userId'`
        - `_data->>'defaultSchema'`
        - `_data->>'timezone'`
        - `_data->>'skipSchemaPattern'`

        ";

        public ApiGetConnection(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
        declare _user_id varchar;
        declare _schema varchar;
        declare _timezone varchar;
        begin

            _user_id := _data->>'userId';
            
            if (_user_id is null) then
                raise exception 'userId is missing!';
            end if;
            
            select data->>'schema', data->>'timezone' into _schema, _timezone from {settings.PgCodeSchema}.users  where id = _user_id;

            if (_schema is null) then
                _schema := _data->>'defaultSchema';
            end if;
 
            if (coalesce(_timezone, '') <> coalesce(_data->>'timezone', '')) then
                _timezone := _data->>'timezone';
                raise info 'setting time user timezone to %', _timezone;
                insert into {settings.PgCodeSchema}.users (id, data) values (_user_id, jsonb_build_object('timezone', _timezone))
                on conflict (id) do update set data = users.data || excluded.data;
            end if;

            return json_build_object(
                'schemas', json_build_object(
                    'names', (
                        select {settings.PgCodeSchema}.{SelectSchemata.Name}(json_build_object('schema', _schema, 'skipPattern', _data->>'skipSchemaPattern'))
                    ),
                    'selected', _schema
                ),
                'scripts', (
                    select {settings.PgCodeSchema}.{SelectScripts.Name}(json_build_object('schema', _schema, 'userId', _user_id))
                ),
                'tables', (
                    select {settings.PgCodeSchema}.{SelectTables.Name}(json_build_object('schema', _schema, 'type', 'BASE TABLE'))
                ),
                'views', (
                    select {settings.PgCodeSchema}.{SelectTables.Name}(json_build_object('schema', _schema, 'type', 'VIEW'))
                ),
                'routines', (
                    select {settings.PgCodeSchema}.{SelectRoutines.Name}(json_build_object('schema', _schema))
                )
            );
            
        end
        ${Name}$
        language plpgsql security definer volatile;
        comment on function {settings.PgCodeSchema}.{Name}(json) is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;
        revoke all on function {settings.PgCodeSchema}.{Name}(json) from public;
        grant execute on function {settings.PgCodeSchema}.{Name}(json) to {connection.UserName};
        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        drop function if exists {settings.PgCodeSchema}.{Name}(_data json);
        
        ");
    }
}