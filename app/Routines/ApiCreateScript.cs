using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class ApiCreateScript : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "api_create_script";
        public const string CommentMarkup = @"

        Creates a new script. Returns script record.

        Params:
        - _data->>'userId' - user id. Cannot be null.
        - _data->>'title' - script title (if not supplied it will be named automatically: ""Script [number]"" )
        - _data->>'schema' - for what schema. Can be null (script for all schemas)

        ";

        public ApiCreateScript(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
        declare _title varchar;
        declare _user_name varchar;
        declare _result json;
        begin

            _title := _data->>'title';
            _user_name := _data->>'userId';

            if (_user_name is null) then
                raise exception 'userId parameter is missing';
            end if;
            
            if (_title is null) then
                _title := 'Script ' || (select count(*) + 1 from {settings.PgCodeSchema}.scripts where user_id = _user_name);
            end if;

            with cte as (
                insert into {settings.PgCodeSchema}.scripts (user_id, title, ""schema"")
                values(_user_name, _title, _data->>'schema')
                returning id, title, comment, schema, comment, timestamp, content, view_state as viewState, timestamp
            )
            select to_json(cte) into _result from cte;

            return _result;

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