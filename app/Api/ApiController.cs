using System;
using System.Linq;
using System.Security.Principal;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Pgcode.Api
{
    [Route("api")]
    public class ApiController : Controller
    {
        private readonly ConnectionManager _connectionManager;
        //private readonly UserProfile _userProfile;
        private readonly ApiAccess _api;

        protected string UserId => User.Identity.Name;
        //protected UserProfile UserProfile => _userProfile.ForUserId(UserId);
        protected ApiAccess Api => _api.ForUserId(UserId);

        public ApiController(
            ConnectionManager connectionManager,
            //UserProfile userProfile,
            ApiAccess api)
        {
            _connectionManager = connectionManager;
            //_userProfile = userProfile;
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
        public async ValueTask<object> Schema(string schema) => await Api.GetSchema(UserId, schema);

        [HttpGet("create-script/{schema}")]
        public async ValueTask<object> CreateScript(string schema) => await Api.CreateScript(UserId, schema);
    }
}
