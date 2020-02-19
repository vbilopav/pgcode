using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class SetUserData : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "set_user_data";
        public const string CommentMarkup = @"

        Sets user profile value by `key` and `userId`.

        Params:
        - _data->>'key' - profile key
        - _data->>'userId' - user id
        - _data->>'value' - value to set

        ";

        public SetUserData(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"
       
        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns void as
        ${Name}$
        declare _now timestamp with time zone;
        begin
            _now := transaction_timestamp() at time zone 'utc';
            
            insert into {settings.PgCodeSchema}.users 
            (
                id, data, timestamp
            )
            values
            (
                _data->>'userId', jsonb_build_object(_data->>'key', _data->>'value'), _now
            )
            on conflict (id) do update
            set
                data = users.data || excluded.data,
                timestamp = _now;

            raise info 'pgcode.users set data key % with value % for user id = %', _data->>'key', _data->>'value', _data->>'userId';
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