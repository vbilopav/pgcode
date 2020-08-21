using System.Threading.Tasks;
using Grpc.Core;
using Pgcode.Connection;
using Pgcode.Execution;
using Pgcode.Protos;

namespace Pgcode.Api
{
    public class ExecuteService : Protos.ExecuteService.ExecuteServiceBase
    {
        private readonly ConnectionManager _connectionManager;

        public ExecuteService(ConnectionManager connectionManager)
        {
            _connectionManager = connectionManager;
        }

        public override async Task Execute(ExecuteRequest request, IServerStreamWriter<ExecuteReply> responseStream, ServerCallContext context)
        {
            //var ctx = context.GetHttpContext();
            //_cookieMiddleware.ProcessCookieAndAddIdentity(ctx);

            var ws = _connectionManager.GetWsConnection(request.ConnectionId);
            if (ws == null)
            {
                context.Status = new Status(StatusCode.NotFound, "connection not initialized");
                return;
            }

            var handler = new ExecuteHandler(ws, request);
            await handler.ReadAsync(responseStream, context.CancellationToken);
        }

        public override async Task Cursor(CursorRequest request, IServerStreamWriter<ExecuteReply> responseStream, ServerCallContext context)
        {
            var ws = _connectionManager.GetWsConnection(request.ConnectionId);
            if (ws == null)
            {
                context.Status = new Status(StatusCode.NotFound, "connection not initialized");
                return;
            }

            await ExecuteHandler.CursorAsync(ws, request, responseStream);
        }
    }
}
