using System.Threading.Tasks;
using Grpc.Core;
using Microsoft.Extensions.Logging;
using Pgcode.Connection;
using Pgcode.Execution;
using Pgcode.Middleware;
using Pgcode.Protos;

namespace Pgcode.Api
{
    public class ExecuteService : Protos.ExecuteService.ExecuteServiceBase
    {
        private readonly ConnectionManager _connectionManager;
        private readonly CookieMiddleware _cookieMiddleware;
        private readonly ILoggerFactory _loggerFactory;
        private readonly Settings _settings;

        public ExecuteService(
            ConnectionManager connectionManager, 
            CookieMiddleware cookieMiddleware, 
            ILoggerFactory loggerFactory, 
            Settings settings)
        {
            _connectionManager = connectionManager;
            _cookieMiddleware = cookieMiddleware;
            _loggerFactory = loggerFactory;
            _settings = settings;
        }

        public override async Task Execute(ExecuteRequest request, IServerStreamWriter<ExecuteReply> responseStream, ServerCallContext context)
        {
            LogRequest(context, request);

            var ws = _connectionManager.GetWsConnection(request.ConnectionId);
            if (ws == null)
            {
                context.Status = new Status(StatusCode.NotFound, "connection not initialized");
                return;
            }

            var handler = new ExecuteHandler(ws, request);
            await handler.ReadAsync(responseStream, context.CancellationToken);
        }

        public override Task ReadCursor(CursorRequest request, IServerStreamWriter<ExecuteReply> responseStream, ServerCallContext context)
        {
            LogRequest(context, request);

            var ws = _connectionManager.GetWsConnection(request.ConnectionId);
            if (ws == null)
            {
                context.Status = new Status(StatusCode.NotFound, "connection not initialized");
                return Task.CompletedTask;
            }

            ExecuteHandler.ReadCursor(ws, request, responseStream);
            return Task.CompletedTask;
        }

        private void LogRequest(ServerCallContext context, object parameters)
        {
            if (!_settings.LogRequests)
            {
                return;
            }
            var ctx = context.GetHttpContext();
            new LoggingMiddleware(_loggerFactory).LogMessage(ctx, additional: parameters);
        }
    }
}
