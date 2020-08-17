using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Threading;
using Microsoft.AspNetCore.SignalR;
using Pgcode.Protos;

namespace Pgcode.Connection
{
    /*
    declare _my_cursor scroll cursor with hold for select * from rental;

    move forward all in _my_cursor; -- rowcount

    move absolute 0 in _my_cursor;

    fetch 10 in _my_cursor;
    fetch 10 in _my_cursor;

    close _my_cursor;
    */

    public static class ExecuteExtension
    {
        public static async IAsyncEnumerable<ExecuteReply> ExecuteAsync(this WorkspaceConnection ws, 
            ExecuteRequest request, 
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            await using var cmd = ws.Connection.CreateCommand();
#pragma warning disable CA2100
            cmd.CommandText = request.Content;
#pragma warning restore CA2100

            var stopwatch = new Stopwatch();
            stopwatch.Start();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            stopwatch.Stop();
            var executionTime = stopwatch.Elapsed;
            ws?.Proxy?.SendAsync($"stats-execute-{request.Id}", new
            {
                time = executionTime.Format(), 
                rows = reader.RecordsAffected
            }, cancellationToken);
            var headerRow = false;
            stopwatch.Start();
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
            await ws.Proxy.SendAsync($"stats-read-{request.Id}", new
            {
                read = stopwatch.Elapsed.Format(),
                execution = executionTime.Format(),
                total = (executionTime + stopwatch.Elapsed).Format()
            }, cancellationToken);
            await reader.CloseAsync();
        }
    }
}
