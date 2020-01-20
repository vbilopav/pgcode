using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Norm.Extensions;
using Npgsql;

namespace Pgcode.Api
{
    public class UserProfile : DataAccess<UserProfile>
    {
        public UserProfile(Settings settings, ConnectionManager connectionManager) : base(settings, connectionManager)
        {
        }

        public ValueTask<string> GetSelectedSchemaAsync(string user) => GetProfileValueAsync(user, "schema", Settings.DefaultSchema);

        public ValueTask SetSelectedSchemaAsync(string user, string schema) => SetProfileValueAsync(user, "schema", schema);

        private T GetProfileValue<T>(string user, string key, T defaultValue = default) => 
            Connection.Single<T>(GetProfileValueQuery(key), user) ?? defaultValue;

        private void SetProfileValue(string user, string key, object value) =>
            Connection.Execute(SetProfileValueQuery(key), ("user", user), ("value", value));

        private async ValueTask<T> GetProfileValueAsync<T>(string user, string key, T defaultValue = default) =>
            await Connection.SingleAsync<T>(GetProfileValueQuery(key), user) ?? defaultValue;

        private async ValueTask SetProfileValueAsync(string user, string key, object value) =>
            await Connection.ExecuteAsync(SetProfileValueQuery(key), ("user", user), ("value", value));

        private string GetProfileValueQuery(string key)  =>  $@"
            select 
                data->>'{key}'
            from 
                {Settings.PgCodeSchema}.users 
            where 
                id = @user";
          
        private string SetProfileValueQuery(string key) => $@"
            insert into {Settings.PgCodeSchema}.users (id, data)
            values (@user, jsonb_build_object('{key}', @value))
            on conflict (id) do 
            update set data = users.data || excluded.data";
    }
}
