using System;
using System.Diagnostics;
using System.Threading;
using Grpc.Core;
using Npgsql;
using Pgcode.Connection;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public class ExecuteHandler
    {
        private readonly WorkspaceConnection _ws;
        private readonly string _readContent;
        private readonly string _cursorContent;
        private readonly string _execContent;

        public ExecuteHandler(WorkspaceConnection ws, string content)
        {
            _ws = ws;
            content = content.Trim();
            var parts = content.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
            var len = parts.Length;
            switch (len)
            {
                case 0:
                    return;
                case 1 when IsSuitableForCursor(content):
                    _cursorContent = content;
                    break;
                case 1:
                    _readContent = content;
                    break;
                default:
                {
                    var last = parts[^1].TrimStart();
                    if (IsSuitableForCursor(last))
                    {
                        _cursorContent = last;
                        _execContent = string.Join(";", parts[..^1]);
                    }
                    else
                    {
                        _execContent = content;
                    }
                    break;
                }
            }
        }

        public ExecuteResponse TryExecute()
        {
            void NoticeHandler(object sender, NpgsqlNoticeEventArgs e)
            {
                _ws.SendPgNotice(e.Notice);
            }
            _ws.Connection.Notice += NoticeHandler;
            _ws.ErrorOffset = null;

            var stopwatch = new Stopwatch();
            
            try
            {
                stopwatch.Start();
                var response = this.Execute();
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

        private ExecuteResponse Execute()
        {
            CleanupWs(_ws);
            if (_readContent != null)
            {
                if (_execContent != null)
                {
                    _ws.ExecuteVoid(_execContent);
                }

                return _ws.ExecuteReader(_readContent);
            }

            if (_cursorContent != null)
            {
                if (_execContent != null)
                {
                    _ws.ExecuteVoid(_execContent);
                }
                try
                {
                    return _ws.ExecuteCursor(_cursorContent);
                }
                catch (PostgresException)
                {
                    CleanupWs(_ws);
                    throw;
                }
            }

            if (_execContent == null)
            {
                return new ExecuteResponse {Message = "empty"};
            }
            _ws.ExecuteVoid(_execContent);
            return new ExecuteResponse{ Message = "execute" };
        }

        public static void TryReadCursor(WorkspaceConnection ws, CursorRequest request, IServerStreamWriter<ExecuteReply> responseStream)
        {
            try
            {
                foreach (var reply in ws.ExecuteCursorReader(request))
                {
                    responseStream.WriteAsync(reply).GetAwaiter().GetResult();
                }
            }
            catch (PostgresException e)
            {
                CleanupWs(ws);
                ws.SendPgError(e);
            }
        }

        private static void CleanupWs(WorkspaceConnection ws)
        {
            using var cmd = ws.Connection.CreateCommand();
            if (ws.IsNewTran)
            {
                cmd.Execute("end");
            }
            else
            {
                ws.CloseCursorIfExists(cmd);
            }
            ws.Cursor = null;
            ws.IsNewTran = false;
        }

        private static bool IsSuitableForCursor(string content)
        {
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