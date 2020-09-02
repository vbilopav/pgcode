using System;
using System.Diagnostics;
using Grpc.Core;
using Npgsql;
using Pgcode.Connection;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public class ExecuteHandler
    {
        private readonly WorkspaceConnection _ws;
        private readonly string _readContent = null;
        private readonly string _cursorContent = null;
        private readonly string _execContent = null;

        public ExecuteHandler(WorkspaceConnection ws, ExecuteRequest request)
        {
            _ws = ws;
            var content = request.Content.Trim();
            var parts = content.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
            var len = parts.Length;
            switch (len)
            {
                case 0:
                    return;
                case 1 when IsSuitableForCursor(content):
                    _cursorContent = request.Content;
                    break;
                case 1:
                    _readContent = request.Content;
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
                        _execContent = request.Content;
                    }
                    break;
                }
            }
        }

        public void Read(IServerStreamWriter<ExecuteReply> responseStream, uint size)
        {
            void NoticeHandler(object sender, NpgsqlNoticeEventArgs e)
            {
                _ws?.SendPgNoticeAsync(e.Notice);
            }
            _ws.Connection.Notice += NoticeHandler;
            _ws.ErrorOffset = null;

            var stopwatch = new Stopwatch();
            stopwatch.Start();
            try
            {
                if (_readContent != null)
                {
                    if (_execContent != null)
                    {
                        _ws.Execute(_execContent);
                    }
                    foreach (var reply in _ws.ExecuteReader(_readContent))
                    {
                        responseStream.WriteAsync(reply).GetAwaiter().GetResult();
                    }
                } 
                else if (_cursorContent != null)
                {
                    if (_execContent != null)
                    {
                        _ws.Execute(_execContent);
                    }
                    try
                    {
                        foreach (var reply in _ws.CreateCursorReader(_cursorContent, size))
                        {
                            responseStream.WriteAsync(reply).GetAwaiter().GetResult();
                        }
                    }
                    catch (PostgresException)
                    {
                        CleanupWs(_ws);
                        throw;
                    }
                }
                else if (_execContent != null)
                {
                    _ws.Execute(_execContent);
                }
                else
                {
                    _ws.SendStatsMessageAsync(new MessageRequest
                    {
                        ReadTime = null,
                        ExecutionTime = stopwatch.Elapsed,
                        RowsAffected = 0,
                        RowsFetched = 0,
                        Message = "empty"
                    }).GetAwaiter().GetResult();
                }
            }
            catch (PostgresException e)
            {
                stopwatch.Stop();
                _ws.SendPgErrorAsync(e, stopwatch.Elapsed).GetAwaiter().GetResult();
            }
            finally
            {
                _ws.Connection.Notice -= NoticeHandler;
            }
        }

        public static void ReadCursor(WorkspaceConnection ws, CursorRequest request, IServerStreamWriter<ExecuteReply> responseStream)
        {
            try
            {
                foreach (var reply in ws.CursorReader(request))
                {
                    responseStream.WriteAsync(reply).GetAwaiter().GetResult();
                }
            }
            catch (PostgresException e)
            {
                CleanupWs(ws);
                ws.SendPgErrorAsync(e, null).GetAwaiter().GetResult();
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
