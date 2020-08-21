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

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static async IAsyncEnumerable<ExecuteReply> CursorReaderAsync(this WorkspaceConnection ws, CursorRequest request)
        {
            await using var cmd = ws.Connection.CreateCommand();
            await cmd.ExecuteAsync($"move absolute {request.From - 1} in \"{ws.Cursor}\"");
            var row = request.From;
            await using var reader = await cmd.ReaderAsync($"fetch {request.To - request.From} in \"{ws.Cursor}\"");
            while (await reader.ReadAsync())
            {
                yield return GetRowReply(row++, reader);
            }
            await reader.CloseAsync();
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
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

            var declareStatement = $"declare \"{cursor}\" cursor for ";
            ws.ErrorOffset = declareStatement.Length;
            stopwatch.Start();
            await cmd.ExecuteAsync($"{declareStatement}{content}", cancellationToken);
            stopwatch.Stop();
            var executionTime = stopwatch.Elapsed;

            stopwatch.Start();
            var rowsAffected = cmd.Execute($"move forward all in \"{cursor}\""); 
            cmd.Execute($"move absolute 0 in \"{cursor}\"");

            uint row = 1;
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
            if (row == 0 || row == rowsAffected)
            {
                cmd.Execute(ws.IsNewTran ? "end" : $"close \"{cursor}\"");
                ws.Cursor = null;
            }
            await ws.SendStatsMessageAsync(new MessageRequest
            {
                ReadTime = stopwatch.Elapsed,
                ExecutionTime = executionTime,
                RowsAffected = rowsAffected,
                RowsFetched = row,
                Message = $"cursor reader \"{cursor}\""
            }, cancellationToken);
        }
    }
}
