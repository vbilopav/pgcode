using System;
using System.Collections.Generic;
using System.Diagnostics;
using Npgsql;
using Pgcode.Connection;
using Pgcode.Protos;

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

        public static void Execute(this WorkspaceConnection ws, string content)
        {
            var stopwatch = new Stopwatch();
            using var cmd = ws.Connection.CreateCommand();
            cmd.CommandText = content;
            stopwatch.Start();
            var rowsAffected = cmd.Execute(content);
            stopwatch.Stop();

            ws.SendStatsMessageAsync(new MessageRequest
            {
                ExecutionTime = stopwatch.Elapsed,
                RowsAffected = rowsAffected,
                RowsFetched = 0,
                Message = "execution"
            }).GetAwaiter().GetResult();
        }

        public static IEnumerable<ExecuteReply> ExecuteReader(this WorkspaceConnection ws, string content)
        {
            var stopwatch = new Stopwatch();
            using var cmd = ws.Connection.CreateCommand();

            stopwatch.Start();
            using var reader = cmd.Reader(content);
            stopwatch.Stop();

            var executionTime = stopwatch.Elapsed;
            var rowsAffected = reader.RecordsAffected;

            stopwatch.Start();
            ulong row = 1;
            if (reader.FieldCount > 0)
            {
                yield return GetHeaderReply(reader);
            }
            while (reader.Read())
            {
                yield return GetRowReply(row++, reader);

                if (row - 1 == Program.Settings.ReadLimit)
                {
                    break;
                }
            }
            stopwatch.Stop();
            row = row > 0 ? row - 1 : 0;
            reader.Close();

            ws.SendStatsMessageAsync(new MessageRequest
            {
                ReadTime = stopwatch.Elapsed,
                ExecutionTime = executionTime,
                RowsAffected = rowsAffected,
                RowsFetched = (uint)row,
                Message = "reader"
            }).GetAwaiter().GetResult();
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

        public static IEnumerable<ExecuteReply> CreateCursorReader(this WorkspaceConnection ws, string content, uint size)
        {
            var stopwatch = new Stopwatch();
            using var cmd = ws.Connection.CreateCommand();
            
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
            cmd.Execute($"{declareStatement}{content}");
            stopwatch.Stop();
            var executionTime = stopwatch.Elapsed;

            stopwatch.Start();
            var rowsAffected = cmd.Execute($"move forward all in \"{cursor}\""); 
            cmd.Execute($"move absolute 0 in \"{cursor}\"");

            ulong row = 1;
            using var reader = cmd.Reader($"fetch {size} in \"{cursor}\"");
            if (reader.FieldCount > 0)
            {
                yield return GetHeaderReply(reader);
            }
            while (reader.Read())
            {
                yield return GetRowReply(row++, reader);
            }
            stopwatch.Stop();
            reader.Close();
            row = row > 0 ? row - 1 : 0;
            if (row == 0 || (int)row == rowsAffected)
            {
                cmd.Execute(ws.IsNewTran ? "end" : $"close \"{cursor}\"");
                ws.Cursor = null;
            }

            ws.SendStatsMessageAsync(new MessageRequest
            {
                ReadTime = stopwatch.Elapsed,
                ExecutionTime = executionTime,
                RowsAffected = rowsAffected,
                RowsFetched = (uint)row,
                Message = $"cursor reader \"{cursor}\""
            }).GetAwaiter().GetResult();
        }
    }
}
