using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Pgcode.Connection;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public class ExecuteHandler
    {
        private readonly WorkspaceConnection _ws;
        private readonly ExecuteRequest _request;
        private readonly string _exec = null;
        private readonly string _read = null;

        public bool HasExecute => _exec != null;
        public bool HasReads => _read != null;

        public ExecuteHandler(WorkspaceConnection ws, ExecuteRequest request)
        {
            _ws = ws;
            _request = request;
            var content = request.Content.Trim();
            var parts = content.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
            var len = parts.Length;
            if (len == 1)
            {
                if (content.StartsWith("select", StringComparison.OrdinalIgnoreCase))
                {
                    _read = request.Content;
                }
                else
                {
                    _exec = request.Content;
                }
            }
            else
            {
                var last = parts[^1].TrimStart();
                if (last.StartsWith("select", StringComparison.OrdinalIgnoreCase))
                {
                    _exec = string.Join(";", parts[..^1]);
                    _read = last;
                }
                else
                {
                    _exec = request.Content;
                }
            }
        }

        public async ValueTask ExecuteAsync(CancellationToken cancellationToken = default)
        {
            await _ws.ExecuteNonReaderAsync(_request, _exec, cancellationToken);
        }

        public IAsyncEnumerable<ExecuteReply> ReadAsync(CancellationToken cancellationToken = default)
        {
            return _ws.ExecuteReaderAsync(_request, _read, cancellationToken);
        }
    }
}
