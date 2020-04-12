using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Pgcode.Migrations._1.Routines;

namespace Pgcode.Api
{
    public class ApiAccess
    {
        private readonly Settings _settings;
        protected readonly ConnectionManager ConnectionManager;

        private string _userId;
        private ConnectionData _connectionData;

        public string UserId => _userId ?? throw new ApiException("UserId is not supplied");


        public ApiAccess(ConnectionManager connectionManager, Settings settings) // : base(connectionManager)
        {
            _settings = settings;
            ConnectionManager = connectionManager;
            _connectionData = null;
            _userId = null;
        }

        public virtual ApiAccess ForUserId(string userId)
        {
            if (_userId != null)
            {
                return this;
            }
            _userId = userId;
            return this;
        }

        public ConnectionData UserConnection
        {
            get
            {
                if (_connectionData != null)
                {
                    return _connectionData;
                }
                return _connectionData = ConnectionManager.GetConnectionDataByUserId(UserId);
            }
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

        public async ValueTask<ContentResult> ApiGetScriptContent(long id) =>
            await UserConnection.GetContentResultAsync(Migrations._1.Routines.ApiGetScriptContent.Name, new { id });
    }
}
