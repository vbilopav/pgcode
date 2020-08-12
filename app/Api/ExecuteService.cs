using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Grpc.Core;
using Microsoft.AspNetCore.SignalR;
using Pgcode.Connection;
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

            var ws = _connectionManager.GetWorkspaceConnection(ctx.User.Identity.Name, request.Id);
            if (ws == null)
            {
                context.Status = new Status(StatusCode.NotFound, "connection not initialized");
            }
            else
            {
                var reply1 = new ExecuteReply();
                reply1.Data.Add(new List<string> { "a1", "b1", "c1" });
                var reply2 = new ExecuteReply();
                reply2.Data.Add(new List<string> { "a2", "b2", "c2" });
                await responseStream.WriteAsync(reply1);
                await responseStream.WriteAsync(reply2);

                await ws.Proxy.SendAsync("Message", "Hello world");
            }
        }
    }
}
