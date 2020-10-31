using System;
using System.Data.SQLite;
using System.Threading.Tasks;
using Npgsql;
using Pgcode.Connection;

namespace Pgcode.Execution
{
    public static class WorkspaceConnectionExt
    {
        public static void CleanupWs(this WorkspaceConnection ws, SQLiteConnection localConnection, bool cleanUpCursor = true)
        {
            if (ws.CursorTaskCancellationTokenSource != null)
            {
                ws.CursorTaskCancellationTokenSource.Cancel();
                if (ws.CursorTask.Status == TaskStatus.Running || ws.CursorTask.Status == TaskStatus.WaitingForActivation)
                {
                    while (!ws.CursorTask.IsCanceled) { };
                }
                ws.CursorTask.Dispose();
                ws.CursorTask = null;
                ws.CursorTaskCancellationTokenSource.Dispose();
                ws.CursorTaskCancellationTokenSource = null;
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