using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.TagHelpers.Cache;
using Npgsql;
using Pgcode.Connection;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public static class ExecuteExtension
    {
        public static void ExecuteVoid(this WorkspaceConnection ws, string content)
        {
            using var cmd = ws.Connection.CreateCommand();
            cmd.CommandText = content;
            cmd.ExecuteNonQuery();
        }

        public static ExecuteResponse ExecuteReader(this WorkspaceConnection ws, string content)
        {
            using var cmd = ws.Connection.CreateCommand();
            cmd.CommandText = content;
            using var reader = cmd.ExecuteReader();

            var response = new ExecuteResponse
            {
                RowsAffected = reader.RecordsAffected,
                Header = GetHeaderFromReader(reader)
            };
            int row = 1;

            ws.Rows = new List<ExecuteReply>();
            while (reader.Read())
            {
                ws.Rows.Add(GetRowReplyFromReader((ulong)row++, reader));
                /*
                if (row - 1 == Program.Settings.ReadLimit)
                {
                    break;
                }
                */
            }

            row = row > 0 ? row - 1 : 0;
            reader.Close();

            response.RowsAffected = row;
            response.Message = "reader";

            return response;
        }

        public static ExecuteResponse ExecuteCursor(this WorkspaceConnection ws, string content)
        {
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
            cmd.Execute($"{declareStatement}{content}");
            var rows = cmd.Execute($"move forward all in \"{cursor}\"");
            using var reader = cmd.Reader($"fetch 0 in \"{cursor}\"");
            try
            {
                return new ExecuteResponse
                {
                    RowsAffected = rows,
                    Header = GetHeaderFromReader(reader),
                    Message = "cursor"
                };
            }
            finally
            {
                reader.Close();
            }
        }

        public static IEnumerable<ExecuteReply> ExecuteCursorReader(this WorkspaceConnection ws, CursorRequest request)
        {
            if (ws.Rows != null)
            {
                foreach (var row in ws.Rows.Skip((int)request.From - 1).Take((int)(request.To - request.From + 1)))
                {
                    yield return row;
                }
            }
            else
            {
                using var cmd = ws.Connection.CreateCommand();
                cmd.Execute($"move absolute {request.From - 1} in \"{ws.Cursor}\"");
                var row = request.From;
                using var reader = cmd.Reader($"fetch {request.To - request.From + 1} in \"{ws.Cursor}\"");
                while (reader.Read())
                {
                    yield return GetRowReplyFromReader(row++, reader);
                }
                reader.Close();
            }
        }

        public static void CloseCursorIfExists(this WorkspaceConnection ws, NpgsqlCommand cmd)
        {
            if (ws.Cursor != null && cmd.Any($"select 1 from pg_cursors where name = '{ws.Cursor}'"))
            {
                cmd.Execute($"close \"{ws.Cursor}\"");
            }
        }

        private static IList<Field> GetHeaderFromReader(NpgsqlDataReader reader)
        {
            if (reader.FieldCount < 1)
            {
                return null;
            }
            var header = new List<Field>();
            for (var index = 0; index < reader.FieldCount; index++)
            {
                header.Add(new Field{ Index = index, Name = reader.GetName(index), Type = reader.GetDataTypeName(index) });
            }
            return header;
        }

        private static ExecuteReply GetRowReplyFromReader(ulong row, NpgsqlDataReader reader)
        {
            var values = new object[reader.FieldCount];
            var len = reader.GetProviderSpecificValues(values);

            var rowReply = new ExecuteReply { RowNumber = (uint)row };
            for (ulong index = 0; index < (uint)len; index++)
            {
                var value = values[index];
                rowReply.Data.Add(value.ToString());
                if (value == DBNull.Value)
                {
                    rowReply.NullIndexes.Add((uint)index);
                }
            }
            return rowReply;
        }
    }
}