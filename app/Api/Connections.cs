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
        public object Get()
        {
            return new
            {
                connections = _connectionManager.GetConnectionsDataNameValue(),
                selected = null as string
            };
        }
    }
}
