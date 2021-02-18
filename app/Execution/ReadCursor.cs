using System;
using System.Collections.Generic;
using Npgsql;

namespace Pgcode.Execution
{
    public partial class ExecuteHandler
    {
        public ExecuteResponse ReadCursor(string content)
        {
            using var cmd = _ws.Connection.CreateCommand();

            var tranId1 = cmd.Single<long>("select txid_current()");
            var tranId2 = cmd.Single<long>("select txid_current()");
            var cursor = _ws.Cursor = $"pgcode_{_ws.ConnectionId}";
            if (tranId1 != tranId2)
            {
                _ws.IsNewTran = true;
                cmd.Execute("begin");
            }
            else
            {
                _ws.CloseCursorIfExists(cmd);
            }

            var declareStatement = $"declare \"{cursor}\" scroll cursor for ";
            _ws.ErrorOffset = declareStatement.Length;
            cmd.Execute($"{declareStatement}{content}");
            var rows = cmd.Execute($"move forward all in \"{cursor}\"");
            using var reader = cmd.Reader($"fetch 0 in \"{cursor}\"") as NpgsqlDataReader;
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
                reader?.Close();
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
    }
}