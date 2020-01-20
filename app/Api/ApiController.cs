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
        private readonly UserProfile _userProfile;
        private readonly InformationSchema _informationSchema;

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
        public async ValueTask<ConnectionResponse> GetConnection(string connection) =>
            new ConnectionResponse
            {
                Schemas = new Schemas
                {
                    Names = await _informationSchema.For(connection).GetSchemasAsync().ToListAsync(),
                    Selected = await _userProfile.For(connection).GetSelectedSchemaAsync(User.Identity.Name)
                }
            };

        [HttpGet("set-schema/{connection}/{schema}")]
        public async ValueTask SetSchema(string connection, string schema) => 
            await _userProfile.For(connection).SetSelectedSchemaAsync(User.Identity.Name, schema);
    }
}
