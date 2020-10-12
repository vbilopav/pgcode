using System;
using System.Data.SQLite;
using System.Diagnostics;
using Grpc.Core;
using Npgsql;
using Pgcode.Connection;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public partial class ExecuteHandler
    {
        private readonly WorkspaceConnection _ws;
        private readonly SQLiteConnection _localConnection;
        private readonly ExecutionMode _mode;

        public ExecuteHandler(
            WorkspaceConnection ws, 
            SQLiteConnection localConnection,
            ExecutionMode? mode = null)
        {
            _ws = ws;
            _localConnection = localConnection;
            _mode = mode ?? Program.Settings.ExecutionMode;
        }

        public ExecuteResponse TryExecute(string content)
        {
            void NoticeHandler(object sender, NpgsqlNoticeEventArgs e)
            {
                _ws.SendPgNotice(e.Notice);
            }
            _ws.Connection.Notice += NoticeHandler;
            _ws.CleanupWs(_localConnection);

            var stopwatch = new Stopwatch();
            
            try
            {
                stopwatch.Start();
                var response = this.Execute(content);
                stopwatch.Stop();
                response.ExecutionTime = stopwatch.Elapsed.Format();
               return response;
            }
            catch (PostgresException e)
            {
                stopwatch.Stop();
                _ws.SendPgError(e);
                var response = new ExecuteResponse
                {
                    Message = "error", 
                    ExecutionTime = stopwatch.Elapsed.Format()
                };
                return response;
            }
            finally
            {
                _ws.Connection.Notice -= NoticeHandler;
            }
        }

        public void TryReadPage(PageRequest request, IServerStreamWriter<DataReply> responseStream)
        {
            try
            {
                if (_mode == ExecutionMode.Cursor)
                {
                    foreach (var reply in ReadPageCursor(request))
                    {
                        responseStream.WriteAsync(reply).GetAwaiter().GetResult();
                    }
                }
                else if (_mode == ExecutionMode.Local || _mode == ExecutionMode.Mixed)
                {
                    foreach (var reply in ReadPageLocal(request))
                    {
                        responseStream.WriteAsync(reply).GetAwaiter().GetResult();
                    }
                }
            }
            catch (PostgresException e)
            {
                _ws.CleanupWs(_localConnection);
                _ws.SendPgError(e);
            }
        }

        private ExecuteResponse Execute(string content)
        {
            var (readContent, cursorContent, execContent) = ParseContent(content);

            if (readContent != null)
            {
                if (execContent != null)
                {
                    ExecuteContent(execContent);
                }

                return ReadLocal(readContent);
            }

            if (cursorContent != null)
            {
                if (execContent != null)
                {
                    ExecuteContent(execContent);
                }
                try
                {
                    switch (_mode)
                    {
                        case ExecutionMode.Cursor:
                            return ReadCursor(cursorContent);
                        case ExecutionMode.Mixed:
                            return ReadMixed(cursorContent);
                    }
                }
                catch (PostgresException)
                {
                    _ws.CleanupWs(_localConnection);
                    throw;
                }
            }

            if (execContent == null)
            {
                return new ExecuteResponse {Message = "empty"};
            }

            ExecuteContent(execContent);
            return new ExecuteResponse{ Message = "execute" };
        }

        private void ExecuteContent(string content)
        {
            using var cmd = _ws.Connection.CreateCommand();
            cmd.Execute(content);
        }

        private (string, string, string) ParseContent(string content)
        {
            string readContent = null, cursorContent = null, execContent = null;
            content = content.Trim();
            var parts = content.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
            var len = parts.Length;
            switch (len)
            {
                case 0:
                    return (null, null, null);
                case 1 when IsSuitableForCursor(content):
                    cursorContent = content;
                    break;
                case 1:
                    readContent = content;
                    break;
                default:
                {
                    var last = parts[^1].TrimStart();
                    if (IsSuitableForCursor(last))
                    {
                        cursorContent = last;
                        execContent = string.Join(";", parts[..^1]);
                    }
                    else
                    {
                        execContent = content;
                    }
                    break;
                }
            }
            return (readContent, cursorContent, execContent);
        }

        private bool IsSuitableForCursor(string content)
        {
            if (_mode == ExecutionMode.Local)
            {
                return false;
            }
            content = content.ToLowerInvariant();
            if (content.StartsWith("select ", StringComparison.OrdinalIgnoreCase) ||
                content.StartsWith("with ", StringComparison.OrdinalIgnoreCase) ||
                content.StartsWith("values ", StringComparison.OrdinalIgnoreCase))
            {
                if ((content.IndexOf("insert ", StringComparison.OrdinalIgnoreCase) != -1) ||
                    (content.IndexOf("update ", StringComparison.OrdinalIgnoreCase) != -1) ||
                    (content.IndexOf("delete ", StringComparison.OrdinalIgnoreCase) != -1))
                {
                    return false;
                }
                return true;
            }
            return false;
        }
    }
}