using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using Npgsql;

namespace Pgcode.Connection
{
    public class WorkspaceConnection
    {
        public string Name { get; set; }
        public string Schema { get; set; }
        public NpgsqlConnection Connection { get; set; }
        public IClientProxy Proxy { get; set; }
    }
}