using Npgsql;

namespace Pgcode.Migrations._1.Routines
{
    public class ApiSaveScript : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "api_save_script";
        public const string CommentMarkup = @"

        Updates script content cotnent or view state.
        Params:
        - _data->>'id' - script id.
        - _data->>'content' - new script content, null skips saving
        - _data->>'viewState' - new script view state, null skips saving

        returns void
        ";

        public ApiSaveScript(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns void as
        ${Name}$
        begin

            if (_data->>'content' is null and _data->>'viewState' is not null) then

                update {settings.PgCodeSchema}.scripts
                set view_state = (_data->>'viewState')::json
                where
                    id = (_data->>'id')::int;

            elsif (_data->>'content' is not null and _data->>'viewState' is null) then

                update {settings.PgCodeSchema}.scripts
                set content = _data->>'content'
                where
                    id = (_data->>'id')::int;
    
            elsif (_data->>'content' is not null and _data->>'viewState' is not null) then

                update {settings.PgCodeSchema}.scripts
                set content = _data->>'content', view_state = (_data->>'viewState')::json
                where
                    id = (_data->>'id')::int;

            else
                raise exception 'content and viewState are missing!';
            end if;

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