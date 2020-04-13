using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Pgcode.Migrations._1.Routines;

namespace Pgcode.Api
{

    [Route("api")]
    public class ApiController : Controller
    {
        private readonly ConnectionManager _connectionManager;
        private readonly Settings _settings;

        private string UserId => User.Identity.Name;

        public ApiController(ConnectionManager connectionManager, Settings settings)
        {
            _connectionManager = connectionManager;
            _settings = settings;
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
        public ContentResult GetConnection(string connection)
        {
            return GetConnectionData(connection).GetContentResult(ApiGetConnection.Name, new
            {
                userId = UserId,
                defaultSchema = _settings.DefaultSchema,
                timezone = HttpContext.Request.Headers["timezone"].ToString(),
                skipSchemaPattern = _settings.SkipSchemaPattern
            });
        }

        [HttpGet("schema/{connection}/{schema}")]
        public ContentResult GetSchema(string connection, string schema)
        {
            return GetConnectionData(connection).GetContentResult(ApiGetSchema.Name, new { userId = UserId, schema });
        }

        [HttpGet("create-script/{connection}/{schema}")]
        public ContentResult GetCreateScript(string connection, string schema)
        {
            // clone and store new connection
            return GetConnectionData(connection).GetContentResult(ApiCreateScript.Name, new { userId = UserId, schema });
        }

        [HttpGet("script-content/{connection}/{id}")]
        public ContentResult GetScriptContent(string connection, int id)
        {
            // clone and store new connection
            return GetConnectionData(connection).GetContentResult(ApiGetScriptContent.Name, new { id });
        }

        private ConnectionData GetConnectionData(string name) => _connectionManager.GetConnectionDataByName(name);
    }
}
