using System;
using System.Threading.Tasks;
using Grpc.Core;
using Pgcode.Connection;
using Pgcode.Execution;
using Pgcode.Middleware;
using Pgcode.Protos;

namespace Pgcode.Api
{
    public class ExecuteService : Protos.ExecuteService.ExecuteServiceBase
    {
        private readonly CookieMiddleware _cookieMiddleware;
        private readonly ConnectionManager _connectionManager;

        public ExecuteService(CookieMiddleware cookieMiddleware, ConnectionManager connectionManager)
        {
            _cookieMiddleware = cookieMiddleware;
            _connectionManager = connectionManager;
        }

        public override async Task Execute(ExecuteRequest request, IServerStreamWriter<ExecuteReply> responseStream, ServerCallContext context)
        {
            var ctx = context.GetHttpContext();
            _cookieMiddleware.ProcessCookieAndAddIdentity(ctx);

            var ws = _connectionManager.GetWsConnection(
                new WorkspaceKey
                {
                    Id = request.Id,
                    UserName = ctx.User.Identity.Name,
                    ConnectionId = request.ConnectionId
                });

            if (ws == null)
            {
                context.Status = new Status(StatusCode.NotFound, "connection not initialized");
                return;
            }

            var handler = new ExecuteHandler(ws, request);
            await handler.ReadAsync(responseStream, context.CancellationToken);
        }
    }
}
