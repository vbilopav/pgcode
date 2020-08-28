using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Threading;
using Npgsql;
using Pgcode.Connection;
using Pgcode.Protos;
// ReSharper disable MethodHasAsyncOverloadWithCancellation

namespace Pgcode.Execution
{
    public static partial class ExecuteExtension
    {
        public static void CloseCursorIfExists(this WorkspaceConnection ws, NpgsqlCommand cmd)
        {
            if (ws.Cursor != null && cmd.Any($"select 1 from pg_cursors where name = '{ws.Cursor}'"))
            {
                cmd.Execute($"close \"{ws.Cursor}\"");
            }
        }

        public static IEnumerable<ExecuteReply> CursorReader(this WorkspaceConnection ws, CursorRequest request)
        {
            using var cmd = ws.Connection.CreateCommand();
            cmd.Execute($"move absolute {request.From - 1} in \"{ws.Cursor}\"");
            var row = request.From;
            using var reader = cmd.Reader($"fetch {request.To - request.From + 1} in \"{ws.Cursor}\"");
            while (reader.Read())
            {
                yield return GetRowReply(row++, reader);
            }
            reader.Close();
        }

        public static async IAsyncEnumerable<ExecuteReply> CreateCursorReaderAsync(
            this WorkspaceConnection ws,
            string content,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var stopwatch = new Stopwatch();
            await using var cmd = ws.Connection.CreateCommand();
            
            var tranId1 = cmd.Single<long>("select txid_current()");
            var tranId2 = cmd.Single<long>("select txid_current()");
            var cursor = ws.Cursor = $"pgcode_{ws.ConnectionId}";
            if (tranId1 != tranId2)
            {
                ws.IsNewTran = true;
                cmd.Execute("begin");
            }
            else
            {
                ws.CloseCursorIfExists(cmd);
            }

            var declareStatement = $"declare \"{cursor}\" scroll cursor for ";
            ws.ErrorOffset = declareStatement.Length;
            stopwatch.Start();
            await cmd.ExecuteAsync($"{declareStatement}{content}", cancellationToken: cancellationToken);
            stopwatch.Stop();
            var executionTime = stopwatch.Elapsed;

            stopwatch.Start();
            var rowsAffected = cmd.Execute($"move forward all in \"{cursor}\""); 
            cmd.Execute($"move absolute 0 in \"{cursor}\"");

            ulong row = 1;
            await using var reader = await cmd.ReaderAsync($"fetch {Program.Settings.CursorFetch} in \"{cursor}\"", cancellationToken);
            if (reader.FieldCount > 0)
            {
                yield return GetHeaderReply(reader);
            }
            while (await reader.ReadAsync(cancellationToken))
            {
                yield return GetRowReply(row++, reader);
            }
            stopwatch.Stop();
            await reader.CloseAsync();
            row = row > 0 ? row - 1 : 0;
            if (row == 0 || (int)row == rowsAffected)
            {
                cmd.Execute(ws.IsNewTran ? "end" : $"close \"{cursor}\"");
                ws.Cursor = null;
            }
            await ws.SendStatsMessageAsync(new MessageRequest
            {
                ReadTime = stopwatch.Elapsed,
                ExecutionTime = executionTime,
                RowsAffected = rowsAffected,
                RowsFetched = (uint)row,
                Message = $"cursor reader \"{cursor}\""
            }, cancellationToken);
        }
    }
}
