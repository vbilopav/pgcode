using System;
using Npgsql;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public static partial class ExecuteExtension
    {
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
