using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

namespace Pgcode.Api
{
    [Route("connections")]
    public class Connections : Controller
    {
        private readonly ConnectionManager _connectionManager;

        public Connections(ConnectionManager connectionManager)
        {
            _connectionManager = connectionManager;
        }

        [HttpGet]
        public IEnumerable<ConnectionInfo> Get() => _connectionManager.GetConnectionsDataNameValue();
    }
}
