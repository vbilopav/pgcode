using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Threading;
using System.Threading.Tasks;
using Npgsql;

namespace Pgcode.Execution
{
    public partial class ExecuteHandler
    {
        private const int SyncReadLimit = 100;

        public ExecuteResponse ReadMixed(string content)
        {
            var response = ReadCursor(content);
            int row = 1;
            _ws.LocalTable = $"\"pgcode_{_ws.ConnectionId}\"";
            var createTable = $"create table {_ws.LocalTable} (";
            var insert = $"insert into {_ws.LocalTable} values (";
            using (var local = _localConnection.CreateCommand())
            using (var cmd = _ws.Connection.CreateCommand())
            {
                for (var index = 0; index < response.Header.Count; index++)
                {
                    createTable = index == 0 ?
                        string.Concat(createTable, "\"", index, "\"", " text") :
                        string.Concat(createTable, ",\"", index, "\" text");
                    insert = index == 0 ?
                        string.Concat(insert, "@", index) :
                        string.Concat(insert, ",@", index);
                }
                insert = string.Concat(insert, ")");
                createTable = string.Concat(createTable, ")");
                local.Execute(createTable);
                local.Execute("begin transaction");
                
                cmd.Execute($"move absolute 0 in \"{_ws.Cursor}\"");
                using var reader = cmd.Reader($"fetch {SyncReadLimit} in \"{_ws.Cursor}\"");
                while (reader.Read())
                {
                    var values = new object[reader.FieldCount];
                    var len = reader.GetProviderSpecificValues(values);
                    local.Parameters.Clear();
                    for (var index = 0; index < len; index++)
                    {
                        var value = values[index];
                        var p = new SQLiteParameter(index.ToString()) { Value = value };
                        local.Parameters.Add(p);
                    }
                    local.Execute(insert);
                    row++;
                }
                reader.Close();
                local.Execute("end transaction");
                row = row > 0 ? row - 1 : 0;
                if (row == response.RowsAffected)
                {
                    CleanUpCursor(cmd);
                    return response;
                }

            }
            _ws.CursorTaskToken = new CancellationTokenSource();
            var token = _ws.CursorTaskToken.Token;

            _ws.CursorTask = Task.Run(async () =>
            {
                await using var local = _localConnection.CreateCommand();
                await using var cmd = _ws.Connection.CreateCommand();
                await using var reader = await cmd.ReaderAsync($"fetch all in \"{_ws.Cursor}\"", _ws.CursorTaskToken.Token);
                while (await reader.ReadAsync(token))
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

                    await local.ExecuteAsync(insert, token);
                    if (token.IsCancellationRequested)
                    {
                        break;
                    }
                }
            }, token);

            return response;
        }

        private void CleanUpCursor(NpgsqlCommand cmd)
        {
            if (_ws.IsNewTran)
            {
                cmd.Execute("end");
            }
            else if (_ws.Cursor != null)
            {
                CloseCursorIfExists(cmd);
            }
            _ws.Cursor = null;
            _ws.IsNewTran = false;
        }
    }
}