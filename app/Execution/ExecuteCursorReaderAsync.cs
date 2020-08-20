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
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static async IAsyncEnumerable<ExecuteReply> ExecuteCursorReaderAsync(
            this WorkspaceConnection ws,
            string content,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var stopwatch = new Stopwatch();
            await using var cmd = ws.Connection.CreateCommand();
            
            var tranId1 = cmd.Single<long>("select txid_current()");
            var tranId2 = cmd.Single<long>("select txid_current()");
            if (tranId1 != tranId2)
            {
                ws.IsNewTran = true;
                cmd.Execute("begin");
            }
            else
            {
                if (ws.Cursor != null && cmd.Single<int>($"select 1 from pg_cursors where name = \"{ws.Cursor}\"") != 1)
                {
                    cmd.Execute($"close \"{ws.Cursor}\"");
                }
            }

            ws.Cursor = $"cursor-{ws.Id}";

            var declareStatement = $"declare \"{ws.Cursor}\" cursor for ";
            ws.ErrorOffset = declareStatement.Length;
            stopwatch.Start();
            await cmd.ExecuteAsync($"{declareStatement}{content}", cancellationToken);
            stopwatch.Stop();
            var executionTime = stopwatch.Elapsed;

            stopwatch.Start();
            var rowsAffected = cmd.Execute($"move forward all in \"{ws.Cursor}\""); 
            cmd.Execute($"move absolute 0 in \"{ws.Cursor}\"");

            uint row = 0;
            await using var reader = await cmd.ReaderAsync($"fetch {Program.Settings.CursorFetch} in \"{ws.Cursor}\"", cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                if (row == 0)
                {
                    yield return GetHeaderReply(row++, reader);
                }

                yield return GetRowReply(row++, reader);
            }
            stopwatch.Stop();
            await reader.CloseAsync();
            row = row > 0 ? row - 1 : 0;
            if (row == 0 || row == rowsAffected)
            {
                cmd.Execute(ws.IsNewTran ? "end" : $"close \"{ws.Cursor}\"");
                ws.Cursor = null;
            }
            await ws.SendStatsMessageAsync(stopwatch.Elapsed, executionTime, rowsAffected, row, $"cursor reader \"{ws.Cursor}\"", cancellationToken);
        }
    }
}
