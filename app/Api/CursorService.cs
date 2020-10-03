// ReSharper disable ClassNeverInstantiated.Global
using System.Threading.Tasks;
using Grpc.Core;
using Microsoft.Extensions.Logging;
using Pgcode.Connection;
using Pgcode.Execution;
using Pgcode.Middleware;
using Pgcode.Protos;

namespace Pgcode.Api
{
    public class CursorService : Protos.CursorService.CursorServiceBase
    {
        private readonly ConnectionManager _connectionManager;
        private readonly CookieMiddleware _cookieMiddleware;
        private readonly ILoggerFactory _loggerFactory;
        private readonly Settings _settings;

        public CursorService(
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

        public override Task Read(CursorRequest request, IServerStreamWriter<ExecuteReply> responseStream, ServerCallContext context)
        {
            LogRequest(context, request);

            var ws = _connectionManager.GetWsConnection(request.ConnectionId);
            if (ws == null)
            {
                // connection needs re-initialization
                context.Status = new Status(StatusCode.NotFound, "404");
                return Task.CompletedTask;
            }
            ExecuteHandler.TryReadCursor(ws, request, responseStream);
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
