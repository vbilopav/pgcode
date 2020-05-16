using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Pgcode.ApiModels;
using Pgcode.Migrations._1.Routines;

namespace Pgcode.Api
{

    public class InitialResponse
    {
        public IEnumerable<ConnectionInfo> Connections { get; set; }
        public string User { get; set; }
        public string Version { get; set; }
    }

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
                    }),
                User = UserId,
                Version = Program.Version
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
        public ContentResult GetSchema(string connection, string schema) => 
            GetConnectionData(connection).GetContentResult(ApiGetSchema.Name, new { userId = UserId, schema });

        [HttpGet("script-create/{connection}/{schema}")]
        public ContentResult GetCreateScript(string connection, string schema) => 
            GetConnectionData(connection).GetContentResult(ApiCreateScript.Name, new { userId = UserId, schema });

        [HttpGet("script-content/{connection}/{id}")]
        public ContentResult GetScriptContent(string connection, int id) => 
            GetConnectionData(connection).GetContentResult(ApiGetScriptContent.Name, new { id });

        [HttpPost("script-content/{connection}/{id}/{viewState}")]
        public async ValueTask<ContentResult> PostScriptContent(string connection, int id, string viewState)
        {
            viewState = Request.ContainsHeader(Strings.ViewStateIsNull) ? null : viewState;
            string content = null;
            if (Request.ContainsHeader(Strings.ContentIsNull))
            {
                return GetConnectionData(connection).GetContentResult(ApiSaveScript.Name, new { id, content, viewState });
            }
            using var stream = new StreamReader(Request.Body);
            content = await stream.ReadToEndAsync();
            return GetConnectionData(connection).GetContentResult(ApiSaveScript.Name, new {id, content, viewState});
        }

        [HttpPost("script-scroll-position/{connection}")]
        public ContentResult PostScriptScrollPosition(string connection, [FromBody]object data) => 
            GetConnectionData(connection).GetContentResult(ApiSaveScriptScrollPosition.Name, data);

        private ConnectionData GetConnectionData(string name) => _connectionManager.GetConnectionDataByName(name);
    }
}
