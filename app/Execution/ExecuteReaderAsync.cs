using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Threading;
using Npgsql;
using Pgcode.Connection;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public static partial class ExecuteExtension
    {
        public static async IAsyncEnumerable<ExecuteReply> ExecuteReaderAsync(
            this WorkspaceConnection ws,
            string content,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var stopwatch = new Stopwatch();
            await using var cmd = ws.Connection.CreateCommand();

            stopwatch.Start();
            await using var reader = await cmd.ReaderAsync(content, cancellationToken);
            stopwatch.Stop();
            
            var executionTime = stopwatch.Elapsed;
            var rowsAffected = reader.RecordsAffected;

            stopwatch.Start();
            ulong row = 1;
            if (reader.FieldCount > 0)
            {
                yield return GetHeaderReply(reader);
            }
            while (await reader.ReadAsync(cancellationToken))
            {
                yield return GetRowReply(row++, reader);

                if (row - 1 == Program.Settings.ReadLimit)
                {
                    break;
                }
            }
            stopwatch.Stop();
            row = row > 0 ? row - 1 : 0;
            await reader.CloseAsync();
            await ws.SendStatsMessageAsync(new MessageRequest
            {
                ReadTime = stopwatch.Elapsed,
                ExecutionTime = executionTime,
                RowsAffected = rowsAffected,
                RowsFetched = (uint)row,
                Message = "reader"
            }, cancellationToken);
        }
    }
}
