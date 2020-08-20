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
        private readonly string _readContent;
        private readonly string _cursorContent;
        private readonly string _execContent;

        public ExecuteHandler(WorkspaceConnection ws, ExecuteRequest request)
        {
            _ws = ws;
            var content = request.Content.Trim();
            var parts = content.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
            var len = parts.Length;
            if (len == 1)
            {
                if (IsSuitableForCursor(content))
                {
                    _cursorContent = request.Content;
                    _readContent = null;
                    _execContent = null;
                }
                else
                {
                    _cursorContent = null;
                    _readContent = request.Content;
                    _execContent = null;
                }
            }
            else
            {
                var last = parts[^1].TrimStart();
                if (IsSuitableForCursor(last))
                {
                    _readContent = null;
                    _cursorContent = last;
                    _execContent = string.Join(";", parts[..^1]);
                }
                else
                {
                    _readContent = null;
                    _cursorContent = null;
                    _execContent = request.Content;
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
                        await _ws.ExecuteNonReaderAsync(_execContent, cancellationToken);
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
                        await _ws.ExecuteNonReaderAsync(_execContent, cancellationToken);
                    }
                    try
                    {
                        await foreach (var reply in _ws.ExecuteCursorReaderAsync(_cursorContent, cancellationToken))
                        {
                            await responseStream.WriteAsync(reply);
                        }
                    }
                    catch (PostgresException)
                    {
                        if (!_ws.IsNewTran)
                        {
                            throw;
                        }
                        await using var cmd = _ws.Connection.CreateCommand();
                        cmd.Execute("end");
                        _ws.Cursor = null;
                        _ws.IsNewTran = false;
                        throw;
                    }
                }
                else if (_execContent != null)
                {
                    await _ws.ExecuteNonReaderAsync(_execContent, cancellationToken);
                }
                else
                {
                    throw new ArgumentException();
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
