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
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security",
            "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
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
            uint row = 0;
            while (await reader.ReadAsync(cancellationToken))
            {
                if (row == 0)
                {
                    yield return GetHeaderReply(row++, reader);
                }

                yield return GetRowReply(row++, reader);

                if (row - 1 == Program.Settings.ReadLimit)
                {
                    break;
                }
            }
            stopwatch.Stop();
            row = row > 0 ? row - 1 : 0;
            await reader.CloseAsync();
            await ws.SendStatsMessageAsync(stopwatch.Elapsed, executionTime, rowsAffected, row > 0 ? row - 1 : 0, "reader", cancellationToken);
        }

        private static ExecuteReply GetHeaderReply(uint row, NpgsqlDataReader r)
        {
            var headerReply = new ExecuteReply { RowNumber = row };
            for (var index = 0; index < r.FieldCount; index++)
            {
                headerReply.Data.Add(
                    $"{{\"name\":\"{r.GetName(index)}\",\"type\":\"{r.GetDataTypeName(index)}\"}}");
            }
            return headerReply;
        }

        private static ExecuteReply GetRowReply(uint row, NpgsqlDataReader r)
        {
            var values = new object[r.FieldCount];
            r.GetProviderSpecificValues(values);

            var rowReply = new ExecuteReply { RowNumber = row };
            for (uint index = 0; index < values.Length; index++)
            {
                var value = values[index];
                rowReply.Data.Add(value.ToString());
                if (value == DBNull.Value)
                {
                    rowReply.NullIndexes.Add(index);
                }
            }
            return rowReply;
        }
    }
}
