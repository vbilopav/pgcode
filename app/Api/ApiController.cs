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

        // ReSharper disable once InconsistentNaming
        private string userId => User.Identity.Name;


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
        public async ValueTask<ContentResult> GetConnection(string connection) =>
            await GetConnectionData(connection).GetContentResultAsync(ApiGetConnection.Name, new
            {
                userId,
                defaultSchema = _settings.DefaultSchema,
                timezone = HttpContext.Request.Headers["timezone"].ToString(),
                skipSchemaPattern = _settings.SkipSchemaPattern
            });

        [HttpGet("schema/{connection}/{schema}")]
        public async ValueTask<ContentResult> GetSchema(string connection, string schema)
        {
            return await GetConnectionData(connection)
                .GetContentResultAsync(ApiGetSchema.Name, new { userId, schema });
        }

        [HttpGet("create-script/{connection}/{schema}")]
        public async ValueTask<ContentResult> GetCreateScript(string connection, string schema)
        {
            // clone and store new connection
            return await GetConnectionData(connection).GetContentResultAsync(ApiCreateScript.Name, new { userId, schema });
        }

        [HttpGet("script-content/{connection}/{id}")]
        public async ValueTask<ContentResult> GetScriptContent(string connection, int id)
        {
            // clone and store new connection
            return await GetConnectionData(connection).GetContentResultAsync(ApiGetScriptContent.Name, new { id });
        }

        private ConnectionData GetConnectionData(string name) => _connectionManager.GetConnectionDataByName(name);
    }
}
