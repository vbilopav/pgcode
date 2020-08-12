using Npgsql;

namespace Pgcode.Migrations._1.Routines
{
    public class ApiCheckItemExists : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "api_check_item_exists";
        public const string CommentMarkup = @"

        Returns boolean does specific item exists
        Params:
        - _data->>'key' - item type, for now only 'scripts' are implemented
        - _data->>'id' - item id, int for 'scripts' otherwise text
        - _data->>'userId' - user id or null for all users (applies only for 'scripts'
        - _data->>'schema' - schema name or null for all schemas

        ";

        public ApiCheckItemExists(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns boolean as
        ${Name}$
        declare _key text;
        declare _id text;
        declare _user_id text;
        declare _schema text;
        begin

           _key := _data->>'key';
           _key := _data->>'key';
           _id := _data->>'id';
           _user_id := _data->>'userId';
           _schema := _data->>'schema';

           if (_key = 'scripts') then

                return (
                    select exists(
                        select 1 from {settings.PgCodeSchema}.scripts
                        where id = _id::int and (_user_id is null or user_id = _user_id) and (_schema is null or schema = _schema)
                    )
                );

           else

             raise exception 'unknown item key: %', _key;

           end if;

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