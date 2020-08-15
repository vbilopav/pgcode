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

        public async ValueTask AddWorkspaceConnectionAsync(WorkspaceKey wsKey, string connectionName, string schema, IClientProxy proxy)
        {
            var key = wsKey.GetKey();
            if (!WorkspaceConnections.ContainsKey(key))
            {
                var data = GetConnectionDataByName(connectionName);
                var connection = data.Connection.CloneWith(data.ConnectionString);
                await connection.OpenAsync();
                WorkspaceConnections.TryAdd(key, new WorkspaceConnection
                {
                    Connection = connection,
                    Name = connectionName,
                    Schema = schema,
                    Proxy = proxy
                });
            }
            else
            {
                WorkspaceConnections[key].Proxy = proxy;
            }
        }

        public WorkspaceConnection GetWorkspaceConnection(WorkspaceKey wsKey)
        {
            return WorkspaceConnections.TryGetValue(wsKey.GetKey(), out var ws) ? ws : null;
        }

        public async ValueTask RemoveWorkspaceConnectionAsync(WorkspaceKey wsKey)
        {
            if (WorkspaceConnections.TryRemove(wsKey.GetKey(), out var ws))
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
