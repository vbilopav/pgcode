using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;
using Pgcode.Protos;

namespace Pgcode.Connection
{
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

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            var headerRow = false;
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

            await reader.CloseAsync();
        }
    }
}
