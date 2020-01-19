using System;
using System.Linq;
using System.Net;
using System.Threading;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Pgcode.Api
{
    [Route("api")]
    public class ApiController : Controller
    {
        private readonly ConnectionManager _connectionManager;
        private readonly DataAccess _dataAccess;
        private readonly ILogger<ApiController> _logger;

        public ApiController(ConnectionManager connectionManager, DataAccess dataAccess, ILogger<ApiController> logger)
        {
            _connectionManager = connectionManager;
            _dataAccess = dataAccess;
            _logger = logger;
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

        [HttpGet("connection/{name}")]
        public ConnectionResponse GetConnection(string name)
        {
            if (SetConnection(name) == null)
            {
                return null;
            }

            return new ConnectionResponse
            {
                Schemas = new Schemas
                {
                    Names = _dataAccess.GetSchemas(),
                    Selected = _dataAccess.GetSelectedSchema(User.Identity.Name)
                }
            };
        }

        private DataAccess SetConnection(string name)
        {
            try
            {
                _dataAccess.For(name);
            }
            catch (DataAccessException e)
            {
                _logger.LogError(e.Message);
                Response.StatusCode = 404;
                return null;
            }

            return _dataAccess;
        }
    }
}
