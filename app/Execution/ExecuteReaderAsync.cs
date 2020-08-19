using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Threading;
using Pgcode.Connection;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public static partial class ExecuteExtension
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security",
            "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static async IAsyncEnumerable<ExecuteReply> ExecuteReaderAsync(
            this WorkspaceConnection ws,
            string content,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var stopwatch = new Stopwatch();
            await using var cmd = ws.Connection.CreateCommand();
            await ws.CloseCursorIfExists(cmd);
            cmd.CommandText = content;

            stopwatch.Start();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            stopwatch.Stop();
            
            var executionTime = stopwatch.Elapsed;
            var rows = reader.RecordsAffected;
            uint row = 0;
            var headerRow = false;

            stopwatch.Start();
            while (await reader.ReadAsync(cancellationToken))
            {
                var count = reader.FieldCount;
                if (!headerRow)
                {
                    var header = new ExecuteReply {RowNumber = row++};
                    for (var index = 0; index < reader.FieldCount; index++)
                    {
                        header.Data.Add(
                            $"{{\"name\":\"{reader.GetName(index)}\",\"type\":\"{reader.GetDataTypeName(index)}\"}}");
                    }

                    yield return header;
                    headerRow = true;
                }

                var values = new object[count];
                reader.GetProviderSpecificValues(values);

                var reply = new ExecuteReply {RowNumber = row++};
                for (uint index = 0; index < values.Length; index++)
                {
                    var value = values[index];
                    reply.Data.Add(value.ToString());
                    if (value == DBNull.Value)
                    {
                        reply.NullIndexes.Add(index);
                    }
                }

                yield return reply;
                if (row == Program.Settings.InitialReadSize)
                {
                    break;
                }
            }
            stopwatch.Stop();

            await reader.CloseAsync();
            await ws.SendStatsMessageAsync(stopwatch.Elapsed, executionTime, rows, "reader", cancellationToken);
        }
    }
}
