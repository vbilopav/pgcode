using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Pgcode.Api
{
    [Route("api")]
    public class ApiController : Controller
    {
        private readonly ConnectionManager _connectionManager;
        private readonly UserProfile _userProfile;
        private readonly ApiAccess _api;

        protected string UserId => User.Identity.Name;
        protected UserProfile UserProfile => _userProfile.ForUserId(UserId);
        protected ApiAccess Api => _api.ForUserId(UserId);

        public ApiController(
            ConnectionManager connectionManager,
            UserProfile userProfile,
            ApiAccess api)
        {
            _connectionManager = connectionManager;
            _userProfile = userProfile;
            _api = api;
        }

        [HttpGet("initial")]
        public InitialResponse GetInitial() =>
            new InitialResponse
            {
                Connections = _connectionManager
                    .GetConnectionsData()
                    .OrderBy(c => c.Name)
                    .Select(c => new ConnectionInfo
                    {
                        Name = c.Name,
                        Version = c.ServerVersion,
                        Host = c.Connection.Host,
                        Port = c.Connection.Port,
                        Database = c.Connection.Database,
                        User = c.Connection.UserName
                    })
            };

        [HttpGet("ws-connection/{connection}")]
        public async ValueTask<ContentResult> GetConnection(string connection)
        {
            _connectionManager.SetConnectionNameByUserId(UserId, connection);
            return await Api.GetWorkspaceForConnectionContentResult(connection, await UserProfile.GetSchemaNameAsync());
        }

        [HttpGet("ws/{schema}")]
        public async ValueTask<object> Schema(string schema)
        {
            await UserProfile.SetSchemaNameAsync(schema);
            return await Api.GetWorkspaceContentResult(schema);
        }
    }
}
