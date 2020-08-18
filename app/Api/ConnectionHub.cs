using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Pgcode.Connection;
using Pgcode.Middleware;
using Pgcode.Migrations._1.Routines;

namespace Pgcode.Api
{
    public class InitialResponse
    {
        public IEnumerable<ConnectionInfo> Connections { get; set; }
        public string User { get; set; }
        public string Version { get; set; }
    }

    public class ConnectionsHub : BaseHub
    {
        private readonly ConnectionManager _connectionManager;


        public ConnectionsHub(
            ConnectionManager connectionManager, 
            Settings settings, 
            CookieMiddleware cookieMiddleware, 
            ILoggerFactory loggerFactory) : base(settings, cookieMiddleware, loggerFactory)
        {
            _connectionManager = connectionManager; ;
        }

        public InitialResponse GetInitial()
        {
            var user = GetIdentityAndLogRequest();
            return new InitialResponse
            {
                Connections = _connectionManager
                    .GetConnectionsData()
                    .OrderBy(c => c.Name)
                    .Select(c => new ConnectionInfo
                    {
                        Name = c.Name,
                        Version = c.ServerVersion,
                        Host = c.Connection.Host,
                        Port = c.Connection.Port,
                        Database = c.Connection.Database,
                        User = c.Connection.UserName
                    }),
                User = user.Name,
                Version = Program.Version
            };
        }

        public async ValueTask<string> GetConnection(string connection, string timezone)
        {
            var user = GetIdentityAndLogRequest();
            var data = _connectionManager.GetConnectionDataByName(connection);
            return await data.GetSingleItemFromCloneAsync<string>(ApiGetConnection.Name, new
            {
                userId = user.Name,
                defaultSchema = Settings.DefaultSchema,
                timezone,
                skipSchemaPattern = Settings.SkipSchemaPattern
            });
        }

        public async ValueTask<string> GetSchema(string connection, string schema)
        {
            var user = GetIdentityAndLogRequest();
            var data = _connectionManager.GetConnectionDataByName(connection);
            return await data.GetSingleItemFromCloneAsync<string>(ApiGetSchema.Name, new { userId = user.Name, schema });
        }

        public async ValueTask<string> CreateScript(string connection, string schema)
        {
            var user = GetIdentityAndLogRequest();
            var data = _connectionManager.GetConnectionDataByName(connection);
            return await data.GetSingleItemFromCloneAsync<string>(ApiCreateScript.Name, new { userId = user.Name, schema });
        }

        public async ValueTask<string> GetScriptContent(string connection, int id)
        {
            LogRequest();
            var data = _connectionManager.GetConnectionDataByName(connection);
            return await data.GetSingleItemFromCloneAsync<string>(ApiGetScriptContent.Name, new { id });
        }

        public async ValueTask<string> SaveScriptContent(string connection, int id, string content, string viewState)
        {
            LogRequest();
            var data = _connectionManager.GetConnectionDataByName(connection);
            return await data.GetSingleItemFromCloneAsync<string>(ApiSaveScript.Name, new { id, content, viewState });
        }

        public async ValueTask<string> SaveScriptScrollPosition(string connection, string data)
        {
            LogRequest();
            var connectionData = _connectionManager.GetConnectionDataByName(connection);
            return await connectionData.GetSingleItemFromCloneAsync<string>(ApiSaveScriptScrollPosition.Name, data);
        }

        public async ValueTask<bool> CheckItemExists(string connection, string schema, string key, string id)
        {
            var user = GetIdentityAndLogRequest();
            var connectionData = _connectionManager.GetConnectionDataByName(connection);
            return await connectionData.GetSingleItemFromCloneAsync<bool>(ApiCheckItemExists.Name, new {key, id, userId = user.Name, schema});
        }
    }
}
