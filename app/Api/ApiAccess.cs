using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Pgcode.Routines;

namespace Pgcode.Api
{
    public class ApiAccess : DataAccess<ApiAccess>
    {
        private readonly Settings _settings;

        public ApiAccess(ConnectionManager connectionManager, Settings settings) : base(connectionManager)
        {
            _settings = settings;
        }

        public async ValueTask<ContentResult> GetConnection(string userId, string timezone) =>
            await UserConnection.GetContentResultAsync(ApiGetConnection.Name, new
            {
                userId,
                defaultSchema = _settings.DefaultSchema,
                timezone,
                skipSchemaPattern = _settings.SkipSchemaPattern
            });

        public async ValueTask<ContentResult> GetSchema(string userId, string schema) => 
            await UserConnection.GetContentResultAsync(ApiGetSchema.Name, new {userId, schema});

        public async ValueTask<ContentResult> CreateScript(string userId, string schema) =>
            await UserConnection.GetContentResultAsync(ApiCreateScript.Name, new { userId, schema });
    }
}
