using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Pgcode.Middleware;

namespace Pgcode.Connection
{

    public class WorkspaceKey
    {
        public string ConnectionId { get; set; }
        public string UserName { get; set; }
        public string Id { get; set; }

        public string Key => $"{this.ConnectionId}-{this.UserName}-{this.Id}";
    }

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

        public async ValueTask AddWorkspaceConnectionAsync(WorkspaceKey key, string connectionName, string schema, IClientProxy proxy)
        {
            if (!WorkspaceConnections.ContainsKey(key.Key))
            {
                var data = GetConnectionDataByName(connectionName);
                var connection = data.Connection.CloneWith(data.ConnectionString);
                await connection.OpenAsync();
                WorkspaceConnections.TryAdd(key.Key, new WorkspaceConnection
                {
                    Connection = connection,
                    Name = connectionName,
                    Schema = schema,
                    Proxy = proxy
                });
            }
            else
            {
                WorkspaceConnections[key.Key].Proxy = proxy;
            }
        }

        public WorkspaceConnection GetWorkspaceConnection(WorkspaceKey key)
        {
            return WorkspaceConnections.TryGetValue(key.Key, out var ws) ? ws : null;
        }

        public async ValueTask RemoveWorkspaceConnectionAsync(WorkspaceKey key)
        {
            if (WorkspaceConnections.TryRemove(key.Key, out var ws))
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
