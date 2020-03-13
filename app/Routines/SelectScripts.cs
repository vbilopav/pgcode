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
        declare _user_id varchar;
        declare _timezone varchar;
        begin

            _user_id := _data->>'userId';
            _timezone := coalesce({settings.PgCodeSchema}.{GetProfileValue.Name}(_data->>'userId', 'timezone'), current_setting('timezone'));

            return coalesce(json_agg(result), '[]')
            from (
                select 
                    id,
                    title as name,
                    schema,
                    comment,
                    timestamp at time zone _timezone as ""timestamp""
                from 
                    {settings.PgCodeSchema}.scripts
                where
                    (_data->>'schema' is null or schema = _data->>'schema')
                    and
                    (_user_id is null or user_id = _user_id)

            ) as result;

        end
        ${Name}$
        language plpgsql security definer stable;
        comment on function {settings.PgCodeSchema}.{Name}(json) is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;
        revoke all on function {settings.PgCodeSchema}.{Name}(json) from public;
        grant execute on function {settings.PgCodeSchema}.{Name}(json) to {connection.UserName};

        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        drop function if exists {settings.PgCodeSchema}.{Name}(_data json);

        ");
    }
}