using System.Collections.Generic;
using System.Data.SQLite;
using System.Threading;
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
        public string LocalTable { get; set; } = null;
        public int? ErrorOffset { get; set; } = null;
        public bool IsNewTran { get; set; } = false;
        public CancellationTokenSource CursorTaskToken { get; set; }
        public Task CursorTask { get; set; }
    }

    public static class WorkspaceConnectionExt
    {
        public static void CleanupWs(this WorkspaceConnection ws, SQLiteConnection localConnection, bool cleanUpCursor = true)
        {
            if (ws.CursorTaskToken != null)
            {
                if (!ws.CursorTask.IsCompleted)
                {
                    ws.CursorTaskToken.Cancel();
                    ws.CursorTask.GetAwaiter().GetResult();
                }
                ws.CursorTaskToken.Dispose();
                ws.CursorTaskToken = null;
                ws.CursorTask.Dispose();
                ws.CursorTask = null;
            }

            if (cleanUpCursor && (ws.IsNewTran || ws.Cursor != null))
            {
                using var cmd = ws.Connection.CreateCommand();
                CleanUpCursor(ws, cmd);
            }

            if (ws.LocalTable != null)
            {
                using var cmd = localConnection.CreateCommand();
                cmd.Execute($"drop table {ws.LocalTable}");
                ws.LocalTable = null;
            }

            ws.ErrorOffset = null;
        }

        public static void CleanUpCursor(this WorkspaceConnection ws, NpgsqlCommand cmd)
        {
            if (ws.IsNewTran)
            {
                cmd.Execute("end");
            }
            else if (ws.Cursor != null)
            {
                CloseCursorIfExists(ws, cmd);
            }
            ws.Cursor = null;
            ws.IsNewTran = false;
        }

        public static void CloseCursorIfExists(this WorkspaceConnection ws, NpgsqlCommand cmd)
        {
            if (ws.Cursor != null && cmd.Any($"select 1 from pg_cursors where name = '{ws.Cursor}'"))
            {
                cmd.Execute($"close \"{ws.Cursor}\"");
            }
        }
    }
}