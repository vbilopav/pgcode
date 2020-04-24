using Npgsql;

namespace Pgcode.Migrations._1.Routines
{
    public class ApiSaveScriptScrollPosition : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "api_save_script_scroll_position";
        public const string CommentMarkup = @"

        Updates script content scroll poistion.
        Params:
        - _data->>'id' - script id.
        - _data->>'top'
        - _data->>'left'

        returns timestamp json string
        ";

        public ApiSaveScriptScrollPosition(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
        declare _timestamp timestamp with time zone;
        begin

            update {settings.PgCodeSchema}.scripts
            set 
                scroll_position = json_build_object(
                    'top', (_data->>'top')::int,
                    'left', (_data->>'left')::int
                )
            where
                id = (_data->>'id')::int
            returning timestamp into _timestamp;

            return to_json(_timestamp);
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