using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Npgsql;

namespace Pgcode.Connection
{
    public class WorkspaceConnection
    {
        public string Id { get; set; }

        public string ConnectionId { get; set; }

        public string Name { get; set; }

        public string Schema { get; set; }

        public NpgsqlConnection Connection { get; set; }

        public IClientProxy Proxy { get; set; }

        public string Cursor { get; set; } = null;

        public int? ErrorOffset { get; set; } = null;
    }
}