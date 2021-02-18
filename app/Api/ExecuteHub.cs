﻿// ReSharper disable ClassNeverInstantiated.Global
using System;
using System.Data.SQLite;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Pgcode.Connection;
using Pgcode.Execution;
using Pgcode.Middleware;

namespace Pgcode.Api
{
    public class ExecuteHub : BaseHub
    {
        private readonly ConnectionManager _connectionManager;
        private readonly SQLiteConnection _localConnection;

        public ExecuteHub(
            ConnectionManager connectionManager, 
            Settings settings, 
            CookieMiddleware cookieMiddleware, 
            ILoggerFactory loggerFactory,
            SQLiteConnection localConnection) : base(settings, cookieMiddleware, loggerFactory)
        {
            _connectionManager = connectionManager;
            _localConnection = localConnection;
            
            loggerFactory.CreateLogger("SQL");
        }

        public void InitConnection(string connection, string schema, string id)
        {
            var user = GetIdentityAndLogRequest();
            _connectionManager.AddWsConnection(new AddWorkspaceConnection
            {
                Id = id,
                UserName = user.Name,
                ConnectionId = this.Context.ConnectionId,
                ConnectionName = connection,
                Schema = schema,
                Proxy = Clients.Caller
            });
        }

        public void DisposeConnection()
        {
            GetIdentityAndLogRequest();
            _connectionManager.RemoveWsConnection(this.Context.ConnectionId);
        }

        public ExecuteResponse Execute(string content)
        {
            this.LogRequest();
            var ws = _connectionManager.GetWsConnection(this.Context.ConnectionId);
            return ws == null ? 
                new ExecuteResponse{ Message = "404"} : 
                new ExecuteHandler(ws, _localConnection).TryExecute(content);
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            _connectionManager.RemoveWsConnection(this.Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
}
