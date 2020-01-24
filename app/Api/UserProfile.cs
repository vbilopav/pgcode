using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Norm.Extensions;

namespace Pgcode.Api
{
    public class UserProfile : DataAccess<UserProfile>
    {
        private static readonly ConcurrentDictionary<string, string> MemoryCache = new ConcurrentDictionary<string, string>();
        private readonly Settings _settings;

        public UserProfile(Settings settings, ConnectionManager connectionManager) : base(connectionManager)
        {
            _settings = settings;
        }

        public ValueTask<string> GetSchemaNameAsync() => GetProfileValueAsync("schema", _settings.DefaultSchema);

        public ValueTask SetSchemaNameAsync(string schema) => SetProfileValueAsync("schema", schema);

        protected async ValueTask<string> GetProfileValueAsync(string key, string defaultValue = default)
        {
            var cacheKey = GetCacheKey(key);
            if (MemoryCache.TryGetValue(cacheKey, out var cacheResult))
            {
                return cacheResult;
            }
            var result = await GetDbProfileValueAsync(key) ?? defaultValue;
            SetCache(cacheKey, result);
            return result;
        }

        protected async ValueTask SetProfileValueAsync(string key, string value)
        {
            SetCache(GetCacheKey(key), value);
            await SetDbProfileValueAsync(key, value);
        }

        private string GetCacheKey(string key) => $"{UserId}-{ConnectionManager.GetConnectionIdByUserId(UserId)}-{key}";

        private void SetCache(string key, string value) => MemoryCache.AddOrUpdate(key, value, (_, __) => value);

        private async ValueTask<string> GetDbProfileValueAsync(string key) =>
            await UserConnection.GetStringAsync("get_user_data", new {key, userId = UserId});

        private async ValueTask SetDbProfileValueAsync(string key, string value)
        {
            await UserConnection.VoidAsync("set_user_data", new { key, userId = UserId, value });
        }
    }
}
