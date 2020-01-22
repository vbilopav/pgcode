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
        private readonly InformationSchema _informationSchema;

        protected string UserId => User.Identity.Name;
        protected UserProfile UserProfile => _userProfile.ForUserId(UserId);
        protected InformationSchema InformationSchema => _informationSchema.ForUserId(UserId);

        public ApiController(
            ConnectionManager connectionManager,
            UserProfile userProfile,
            InformationSchema informationSchema)
        {
            _connectionManager = connectionManager;
            _userProfile = userProfile;
            _informationSchema = informationSchema;
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
        public async ValueTask<ConnectionResponse> GetConnection(string connection)
        {
            if (!_connectionManager.SetConnectionNameByUserId(UserId, connection))
            {
                throw new ApiException($"Unknown connection name {connection}", 404);
            }

            return new ConnectionResponse
            {
                Schemas = new Schemas
                {
                    Names = await InformationSchema.GetSchemaNamesAsync().ToListAsync(),
                    Selected = await UserProfile.GetSchemaNameAsync()
                }
            };
        }

        [HttpGet("schema/{schema}")]
        public async ValueTask<object> Schema(string schema)
        {
            await UserProfile.SetSchemaNameAsync(schema);
            
            return new
            {
                schema
            };
        }
    }
}
