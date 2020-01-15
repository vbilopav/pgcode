using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Pgcode.Api
{
    [Route("api")]
    public class ApiController : Controller
    {
        private readonly ConnectionManager _connectionManager;
        private readonly DataAccess _dataAccess;

        public ApiController(ConnectionManager connectionManager, DataAccess dataAccess)
        {
            _connectionManager = connectionManager;
            _dataAccess = dataAccess;
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

        [HttpGet("connection")]
        public ConnectionResponse GetConnection()
        {
            _dataAccess.ForUser(User.Identity.Name);
            return new ConnectionResponse
            {
                Schemas = new Schemas
                {
                    Names = _dataAccess.GetSchemas(),
                    Selected = _dataAccess.GetSelectedSchema()
                }
            };
        }
    }
}
