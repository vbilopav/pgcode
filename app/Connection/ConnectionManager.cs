using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Pgcode.Middleware;

namespace Pgcode.Connection
{
    public sealed partial class ConnectionManager : IDisposable
    {
        public IEnumerable<ConnectionData> GetConnectionsData() => _connections.Values;

        public ConnectionData GetConnectionDataByName(string connectionName)
        {
            if (_connections.TryGetValue(connectionName, out var data))
            {
                return data;
            }
            throw new ApiException($"Unknown connection name {connectionName}", 404);
        }

        public async ValueTask AddWorkspaceConnectionAsync(string username, string id, string connectionName, string schema, IClientProxy proxy)
        {
            var key = $"{username}__{id}";
            if (!WorkspaceConnections.ContainsKey(key))
            {
                var data = GetConnectionDataByName(connectionName);
                var connection = data.Connection.CloneWith(data.ConnectionString);
                await connection.OpenAsync();
                WorkspaceConnections.TryAdd(key, new WorkspaceConnection
                {
                    Connection = connection,
                    Proxy = proxy,
                    Name = connectionName,
                    Schema = schema
                });
            }
        }

        public WorkspaceConnection GetWorkspaceConnection(string username, string id)
        {
            var key = $"{username}__{id}";
            return WorkspaceConnections.TryGetValue(key, out var ws) ? ws : null;
        }

        public async ValueTask RemoveWorkspaceConnectionAsync(string username, string id)
        {
            var key = $"{username}__{id}";
            if (WorkspaceConnections.TryRemove(key, out var ws))
            {
                await ws.Connection.CloseAsync();
                ws.Connection.Dispose();
            }
        }

        public void Dispose()
        {
            ReleaseUnmanagedResources();
            GC.SuppressFinalize(this);
        }

        ~ConnectionManager()
        {
            ReleaseUnmanagedResources();
        }
    }
}
