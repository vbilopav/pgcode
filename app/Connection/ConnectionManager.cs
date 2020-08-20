using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Npgsql;
using Pgcode.Execution;
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

        public async ValueTask AddWsConnectionAsync(WorkspaceKey key, string connectionName, string schema, IClientProxy proxy)
        {
            if (!WorkspaceConnections.ContainsKey(key.ConnectionId))
            {
                var data = GetConnectionDataByName(connectionName);
                var builder = new NpgsqlConnectionStringBuilder(data.ConnectionString);
                builder.ApplicationName = $"{builder.ApplicationName} - {key.Id}";
                var connection = data.Connection.CloneWith(builder.ToString());
                await connection.OpenAsync();
                WorkspaceConnections.TryAdd(key.ConnectionId, new WorkspaceConnection
                {
                    Id = key.Id,
                    ConnectionId = key.ConnectionId,
                    Connection = connection,
                    Name = connectionName,
                    Schema = schema,
                    Proxy = proxy
                });
            }
            else
            {
                WorkspaceConnections[key.ConnectionId].Proxy = proxy;
            }
        }

        public WorkspaceConnection GetWsConnection(WorkspaceKey key)
        {
            return WorkspaceConnections.TryGetValue(key.ConnectionId, out var ws) ? ws : null;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public async ValueTask RemoveWsConnectionAsync(string connectionId)
        {
            if (WorkspaceConnections.TryRemove(connectionId, out var ws))
            {
                try
                {
                    await ws.CloseCursorIfExists();
                }
                finally
                {
                    await ws.Connection.CloseAsync();
                    ws.Connection.Dispose();
                }
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
