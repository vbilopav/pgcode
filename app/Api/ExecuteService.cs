using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Grpc.Core;
using Microsoft.AspNetCore.SignalR;
using Npgsql;
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

            var messageName = $"message-{request.Id}";
            void NoticeHandler(object sender, NpgsqlNoticeEventArgs e)
            {
                ws.Proxy?.SendAsync(messageName, new Message(e.Notice), context.CancellationToken);
            }
            ws.Connection.Notice += NoticeHandler;
            
            var stopwatch = new Stopwatch();
            stopwatch.Start();
            try
            {
                var handler = new ExecuteHandler(ws, request);
                if (handler.HasExecute)
                {
                    await handler.ExecuteAsync(context.CancellationToken);
                }
                if (handler.HasReads)
                {
                    await foreach (var reply in handler.ReadAsync(context.CancellationToken))
                    {
                        await responseStream.WriteAsync(reply);
                    }
                }
            }
            catch (PostgresException e)
            {
                stopwatch.Stop();
                ws?.Proxy?.SendAsync(messageName, new Message(e, stopwatch.Elapsed), context.CancellationToken);
            }
            stopwatch.Stop();
            ws.Connection.Notice -= NoticeHandler;
        }
    }
}
