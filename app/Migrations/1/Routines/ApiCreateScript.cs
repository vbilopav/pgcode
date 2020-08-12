using Npgsql;
using Pgcode.Migrations._1.Tables;

namespace Pgcode.Migrations._1.Routines
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
        declare _user_id varchar;
        declare _timezone varchar;
        declare _result json;
        declare _id int;
        begin

            _title := _data->>'title';
            _user_id := _data->>'userId';
            _id := nextval('{settings.PgCodeSchema}.{Scripts.Name}_id_seq');

            if (_user_id is null) then
                raise exception 'userId parameter is missing';
            end if;

            _timezone := coalesce({settings.PgCodeSchema}.{GetProfileValue.Name}(_data->>'userId', 'timezone'), current_setting('timezone'));
            
            if (_title is null) then
                _title := 'Script ' || _id::varchar;
            end if;

            with cte as (
                insert into {settings.PgCodeSchema}.scripts (
                    id, user_id, title, ""schema""
                )
                values(
                    _id, _user_id, _title, _data->>'schema'
                )
                returning 
                    id, 
                    title as name, {settings.PgCodeSchema}.{MaxStr.Name}(comment) as comment, 
                    schema, 
                    content, 
                    view_state as viewState, 
                    timestamp at time zone _timezone as ""timestamp""
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