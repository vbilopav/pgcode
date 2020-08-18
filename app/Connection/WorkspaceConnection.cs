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

        public string SetCursorName()
        {
            Cursor = $"cursor-{Id}";
            return Cursor;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public async Task CloseCursorIfExists()
        {
            if (Cursor == null)
            {
                return;
            }
            await using var cmd = Connection.CreateCommand();
            cmd.CommandText = $"close \"{Cursor}\"";
            await cmd.ExecuteNonQueryAsync();
        }
    }
}