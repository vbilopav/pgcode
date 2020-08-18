using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using Microsoft.AspNetCore.SignalR;
using Norm.Extensions;
using Npgsql;
using Pgcode.Connection;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public static partial class ExecuteExtension
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static async IAsyncEnumerable<ExecuteReply> ExecuteReaderAsync(
            this WorkspaceConnection ws, 
            ExecuteRequest request,
            string content,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            await using var cmd = ws.Connection.CreateCommand();
            if (ws.Cursor != null)
            {
                cmd.CommandText = $"close \"{ws.Cursor}\"";
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            var cursor = ws.SetCursorName();
      
            var stopwatch = new Stopwatch();
            stopwatch.Start();
            cmd.CommandText = $"declare \"{cursor}\" scroll cursor with hold for {content}";
            await cmd.ExecuteNonQueryAsync(cancellationToken);
            cmd.CommandText = $"move forward all in \"{cursor}\"";
            var rowsAffected = await cmd.ExecuteNonQueryAsync(cancellationToken);
            stopwatch.Stop();

            var executionTime = stopwatch.Elapsed;
            ws?.Proxy?.SendExecStats(request.Id, executionTime, rowsAffected, cancellationToken);
            var headerRow = false;

            stopwatch.Start();

            cmd.CommandText = $"move absolute 0 in \"{cursor}\"";
            await cmd.ExecuteNonQueryAsync(cancellationToken);
            cmd.CommandText = $"fetch {Program.Settings.InitialReadSize} in \"{cursor}\"";

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
            {
                var count = reader.FieldCount;
                if (!headerRow)
                {
                    var header = new ExecuteReply();
                    for (var index = 0; index < reader.FieldCount; index++)
                    {
                        header.Data.Add($"{{\"name\":\"{reader.GetName(index)}\",\"type\":\"{reader.GetDataTypeName(index)}\"}}");
                    }
                    yield return header;
                    headerRow = true;
                }
                var values = new object[count];
                reader.GetProviderSpecificValues(values);
                
                var reply = new ExecuteReply();
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
            }
            stopwatch.Stop();

            ws?.Proxy?.SendReadStats(request.Id, stopwatch.Elapsed, executionTime, cancellationToken);
            await reader.CloseAsync();
        }
    }
}
