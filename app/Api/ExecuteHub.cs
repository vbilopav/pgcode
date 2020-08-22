using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Pgcode.Connection;
using Pgcode.Middleware;


namespace Pgcode.Api
{
    public class ExecuteHub : BaseHub
    {
        private readonly ConnectionManager _connectionManager;

        public ExecuteHub(
            ConnectionManager connectionManager, 
            Settings settings, 
            CookieMiddleware cookieMiddleware, 
            ILoggerFactory loggerFactory) : base(settings, cookieMiddleware, loggerFactory)
        {
            _connectionManager = connectionManager;
        }

        public async ValueTask InitConnection(string connection, string schema, string id)
        {
            var user = GetIdentityAndLogRequest();
            await _connectionManager.AddWsConnectionAsync(new AddWorkspaceConnection
            {
                Id = id,
                UserName = user.Name,
                ConnectionId = this.Context.ConnectionId,
                ConnectionName = connection,
                Schema = schema,
                Proxy = Clients.Caller
            });
        }

        public async ValueTask DisposeConnection()
        {
            var user = GetIdentityAndLogRequest();
            await _connectionManager.RemoveWsConnectionAsync(this.Context.ConnectionId);
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await _connectionManager.RemoveWsConnectionAsync(this.Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
}
