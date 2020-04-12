using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Pgcode.Api
{

    [Route("api")]
    public class ApiController : Controller
    {
        private readonly ConnectionManager _connectionManager;
        private readonly ApiAccess _api;

        protected string UserId => User.Identity.Name;
        protected ApiAccess Api => _api.ForUserId(UserId);

        public ApiController(
            ConnectionManager connectionManager,
            ApiAccess api)
        {
            _connectionManager = connectionManager;
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

        [HttpGet("connection/{connection}")]
        public async ValueTask<ContentResult> GetConnection(string connection)
        {
            _connectionManager.SetConnectionNameByUserId(UserId, connection);
            return await Api.GetConnection(UserId, HttpContext.Request.Headers["timezone"].ToString());
        }

        [HttpGet("schema/{schema}")]
        public async ValueTask<ContentResult> Schema(string schema)
        {
            return await Api.GetSchema(UserId, schema);
        }

        [HttpGet("create-script/{schema}")]
        public async ValueTask<ContentResult> CreateScript(string schema)
        {
            return await Api.CreateScript(UserId, schema);
        }

        [HttpGet("script-content/{id}")]
        public async ValueTask<ContentResult> ScriptContent(int id)
        {
            return await Api.ApiGetScriptContent(id);
        }
    }
}
