using System;
using System.Collections.Generic;
using System.Data.SQLite;

namespace Pgcode.Execution
{
    public partial class ExecuteHandler
    {
        public ExecuteResponse ReadLocal(string content)
        {
            using var cmd = _ws.Connection.CreateCommand();
            cmd.CommandText = content;
            using var reader = cmd.ExecuteReader();

            if (reader.FieldCount < 1)
            {
                return new ExecuteResponse {RowsAffected = 0, Header = null};
            }

            using var local = _localConnection.CreateCommand();
            _ws.LocalTable = $"\"pgcode_{_ws.ConnectionId}\"";
            var createTable = $"create table {_ws.LocalTable} (";
            var insert = $"insert into {_ws.LocalTable} values (";

            var header = new List<Field>();
            for (var index = 0; index < reader.FieldCount; index++)
            {
                var field = new Field { Index = index, Name = reader.GetName(index), Type = reader.GetDataTypeName(index) };
                createTable = index == 0 ? 
                    string.Concat(createTable, "\"", index, "\"", " text") : 
                    string.Concat(createTable, ",\"", index, "\" text");
                insert = index == 0 ?
                    string.Concat(insert, "@", index) :
                    string.Concat(insert, ",@", index);
                header.Add(field);
            }
            insert = string.Concat(insert, ")");
            createTable = string.Concat(createTable, ")");
            local.Execute(createTable);
            local.Execute("begin transaction");
            var response = new ExecuteResponse
            {
                Header = header
            };
            int row = 1;

            while (reader.Read())
            {
                var values = new object[reader.FieldCount];
                var len = reader.GetProviderSpecificValues(values);
                local.Parameters.Clear();
                for (var index = 0; index < len; index++)
                {
                    var value = values[index];
                    var p = new SQLiteParameter(index.ToString()) {Value = value};
                    local.Parameters.Add(p);
                }
                local.Execute(insert);
                row++;
            }
            local.Execute("end transaction");

            row = row > 0 ? row - 1 : 0;
            reader.Close();

            response.RowsAffected = row;
            response.Message = "reader";

            return response;
        }
    }
}