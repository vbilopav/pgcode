using Microsoft.AspNetCore.SignalR;
using Npgsql;

namespace Pgcode.Connection
{
    public class AddWorkspaceConnection
    {
        public string ConnectionId { get; set; }
        public string UserName { get; set; }
        public string Id { get; set; }
        public string ConnectionName { get; set; }
        public string Schema { get; set; }
        public IClientProxy Proxy { get; set; }
    }

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

        public bool IsNewTran { get; set; } = false;
    }
}