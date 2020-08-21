using System;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Grpc.Core;
using Npgsql;
using Pgcode.Connection;
using Pgcode.Protos;
// ReSharper disable MethodHasAsyncOverloadWithCancellation

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

        [SuppressMessage("ReSharper", "MethodSupportsCancellation")]
        public async ValueTask ReadAsync(IServerStreamWriter<ExecuteReply> responseStream, CancellationToken cancellationToken = default)
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
                        await _ws.ExecuteAsync(_execContent, cancellationToken);
                    }
                    await foreach (var reply in _ws.ExecuteReaderAsync(_readContent, cancellationToken))
                    {
                        await responseStream.WriteAsync(reply);
                    }
                } 
                else if (_cursorContent != null)
                {
                    if (_execContent != null)
                    {
                        await _ws.ExecuteAsync(_execContent, cancellationToken);
                    }
                    try
                    {
                        await foreach (var reply in _ws.CreateCursorReaderAsync(_cursorContent, cancellationToken))
                        {
                            await responseStream.WriteAsync(reply);
                        }
                    }
                    catch (PostgresException)
                    {
                        await using var cmd = _ws.Connection.CreateCommand();
                        if (_ws.IsNewTran)
                        {
                            cmd.Execute("end");
                        }
                        else
                        {
                            _ws.CloseCursorIfExists(cmd);
                        }
                        _ws.Cursor = null;
                        _ws.IsNewTran = false;
                        throw;
                    }
                }
                else if (_execContent != null)
                {
                    await _ws.ExecuteAsync(_execContent, cancellationToken);
                }
                else
                {
                    await _ws.SendStatsMessageAsync(new MessageRequest
                    {
                        ReadTime = null,
                        ExecutionTime = stopwatch.Elapsed,
                        RowsAffected = 0,
                        RowsFetched = 0,
                        Message = "empty"
                    }, cancellationToken);
                }
            }
            catch (PostgresException e)
            {
                stopwatch.Stop();
                await _ws.SendPgErrorAsync(e, stopwatch.Elapsed);
            }
            finally
            {
                _ws.Connection.Notice -= NoticeHandler;
            }
        }

        public static async ValueTask CursorAsync(WorkspaceConnection ws, CursorRequest request, IServerStreamWriter<ExecuteReply> responseStream)
        {
            try
            {
                await foreach (var reply in ws.CursorReaderAsync(request))
                {
                    await responseStream.WriteAsync(reply);
                }
            }
            catch (PostgresException e)
            {
                await ws.SendPgErrorAsync(e, null);
            }
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
