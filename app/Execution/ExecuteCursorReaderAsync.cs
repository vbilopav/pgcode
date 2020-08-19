using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Npgsql;
using Pgcode.Connection;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public static partial class ExecuteExtension
    {
        public static string SetCursorName(this WorkspaceConnection ws)
        {
            ws.Cursor = $"cursor-{ws.Id}";
            return ws.Cursor;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static async ValueTask CloseCursorIfExists(this WorkspaceConnection ws, NpgsqlCommand cmd = null)
        {
            if (ws.Cursor == null)
            {
                return;
            }
            void SetCmd() { cmd.CommandText = "end;"; }
            if (cmd != null)
            {
                SetCmd();
                await cmd.ExecuteNonQueryAsync();
            }
            else
            {
                await using (cmd = ws.Connection.CreateCommand())
                {
                    SetCmd();
                    await cmd.ExecuteNonQueryAsync();
                }
            }
            ws.Cursor = null;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static async IAsyncEnumerable<ExecuteReply> ExecuteCursorReaderAsync(
            this WorkspaceConnection ws,
            string content,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var stopwatch = new Stopwatch();
            await using var cmd = ws.Connection.CreateCommand();
            await ws.CloseCursorIfExists(cmd);
            var cursor = ws.SetCursorName();
            
            var declareStatement = $"declare \"{cursor}\" cursor for ";
            ws.ErrorOffset = declareStatement.Length;
            stopwatch.Start();
            cmd.CommandText = "begin;";
            await cmd.ExecuteNonQueryAsync(cancellationToken);
            cmd.CommandText = $"{declareStatement}{content}";
            await cmd.ExecuteNonQueryAsync(cancellationToken);
            stopwatch.Stop();

            var executionTime = stopwatch.Elapsed;
            uint row = 0;
            var headerRow = false;

            stopwatch.Start();
            cmd.CommandText = $"move forward all in \"{cursor}\"";
            var rowsAffected = await cmd.ExecuteNonQueryAsync(cancellationToken);
            cmd.CommandText = $"move absolute 0 in \"{cursor}\"";
            await cmd.ExecuteNonQueryAsync(cancellationToken);
            cmd.CommandText = $"fetch {Program.Settings.CursorFetch} in \"{cursor}\"";
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        
            while (await reader.ReadAsync(cancellationToken))
            {
                var count = reader.FieldCount;
                if (!headerRow)
                {
                    var header = new ExecuteReply { RowNumber = row++ };
                    for (var index = 0; index < reader.FieldCount; index++)
                    {
                        header.Data.Add($"{{\"name\":\"{reader.GetName(index)}\",\"type\":\"{reader.GetDataTypeName(index)}\"}}");
                    }
                    yield return header;
                    headerRow = true;
                }
                var values = new object[count];
                reader.GetProviderSpecificValues(values);
                
                var reply = new ExecuteReply { RowNumber = row++ };
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
            await reader.CloseAsync();
            row--;
            if (row == rowsAffected)
            {
                await ws.CloseCursorIfExists(cmd);
            }
            await ws.SendStatsMessageAsync(stopwatch.Elapsed, executionTime, rowsAffected, row, $"cursor reader \"{ cursor}\"", cancellationToken);
        }
    }
}
