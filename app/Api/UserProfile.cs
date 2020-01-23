using System.Collections.Concurrent;
using System.Threading.Tasks;
using Norm.Extensions;

namespace Pgcode.Api
{
    public class UserProfile : DataAccess<UserProfile>
    {
        private static readonly ConcurrentDictionary<string, object> MemoryCache = new ConcurrentDictionary<string, object>();
        private readonly Settings _settings;

        public UserProfile(Settings settings, ConnectionManager connectionManager) : base(connectionManager)
        {
            _settings = settings;
        }

        public ValueTask<string> GetSchemaNameAsync() => GetProfileValueAsync("schema", _settings.DefaultSchema);

        //public string GetSchemaName() => GetProfileValue("schema", _settings.DefaultSchema);

        public ValueTask SetSchemaNameAsync(string schema) => SetProfileValueAsync("schema", schema);

        protected async ValueTask<T> GetProfileValueAsync<T>(string key, T defaultValue = default)
        {
            var cacheKey = GetCacheKey(key);
            if (MemoryCache.TryGetValue(cacheKey, out var cacheResult))
            {
                return (T)cacheResult;
            }
            var result = await Connection.SingleAsync<T>(GetDbProfileValueQuery(key), UserId) ?? defaultValue;
            SetCache(cacheKey, result);
            return result;
        }

        protected async ValueTask SetProfileValueAsync<T>(string key, T value)
        {
            SetCache(GetCacheKey(key), value);
            await Connection.ExecuteAsync(SetDbProfileValueQuery(key), ("userId", UserId), ("value", value));
        }

        private string GetCacheKey(string key) => $"{UserId}-{ConnectionManager.GetConnectionIdByUserId(UserId)}-{key}";

        private void SetCache(string key, object value) => MemoryCache.AddOrUpdate(key, value, (_, __) => value);

        private string GetDbProfileValueQuery(string key)  =>  $@"
            select 
                data->>'{key}'
            from 
                {_settings.PgCodeSchema}.users 
            where 
                id = @userId";

        private string SetDbProfileValueQuery(string key) => $@"
            insert into {_settings.PgCodeSchema}.users 
            (   id,         data    )
            values 
            (   @userId,    jsonb_build_object('{key}', @value) )
            on conflict (id) do 
            update 
                set 
                    data = users.data || excluded.data";
    }
}
