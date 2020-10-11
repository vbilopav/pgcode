using System;
using System.Collections.Generic;
using System.Data.Common;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public partial class ExecuteHandler
    {
        public IEnumerable<DataReply> ReadPageCursor(PageRequest request)
        {
            using var cmd = _ws.Connection.CreateCommand();
            cmd.Execute($"move absolute {request.From - 1} in \"{_ws.Cursor}\"");
            var row = request.From;
            using var reader = cmd.Reader($"fetch {request.To - request.From + 1} in \"{_ws.Cursor}\"");
            while (reader.Read())
            {
                yield return GetRowReplyFromReader(row++, reader);
            }
            reader.Close();
        }

        public IEnumerable<DataReply> ReadPageLocal(PageRequest request)
        {
            using var cmd = _localConnection.CreateCommand();
            var row = request.From;
            using var reader = cmd.Reader($"select * from {_ws.LocalTable} limit {request.From - 1},{request.To - request.From + 1}");
            while (reader.Read())
            {
                yield return GetRowReplyFromReader(row++, reader);
            }
            reader.Close();
        }

        private static DataReply GetRowReplyFromReader(ulong row, DbDataReader reader)
        {
            var values = new object[reader.FieldCount];
            var len = reader.GetProviderSpecificValues(values);

            var rowReply = new DataReply { RowNumber = (uint)row };
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