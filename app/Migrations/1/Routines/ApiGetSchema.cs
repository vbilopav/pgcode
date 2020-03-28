using Npgsql;

namespace Pgcode.Migrations._1.Routines
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
        - routines (value from `{SelectRoutines.Name}`)
        Params:
        - `_data->>'userId'`
        - `_data->>'schema'`

        ";

        public ApiGetSchema(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
        declare _user_id varchar;
        declare _schema varchar;
        begin

            _user_id := _data->>'userId';
            
            if (_user_id is null) then
                raise exception 'userId is missing!';
            end if;

            _schema := _data->>'schema';
            
            if (_schema is null) then
                raise exception 'schema is missing!';
            end if;

            insert into {settings.PgCodeSchema}.users (id, data) values (_user_id, jsonb_build_object('schema', _schema))
            on conflict (id) do update set data = users.data || excluded.data;

            return json_build_object(
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
                ),
                'name', _schema
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