using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class ApiCreateNewScript : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "api_create_new_script";
        public const string CommentMarkup = @"

        Creates a new script. Returns script record.

        Params:
        - _data->>'userId' - user id
        - _data->>'title' - script title (if not supplied it will be autonamed using next identity)
        - _data->>'schema' - for what schema. Can be null (script for all schemas)

        ";

        public ApiCreateNewScript(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"
       
        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
        declare _title varchar;
        declare _id int;
        declare _result json;
        begin

            _title := _data->>'title';
            _id := nextval(pg_get_serial_sequence('pgcode.scripts', 'id'));

            if (_title is null) then
                _title := 'Script ' || _id;
            end if;
           
            with cte as (
                insert into pgcode.scripts (id, user_id, title, ""schema"")
                overriding system value
                values(_id, _data->>'userId', _title, _data->>'schema')
                returning *
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