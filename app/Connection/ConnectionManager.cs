using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Npgsql;
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

        public async ValueTask AddWsConnectionAsync(AddWorkspaceConnection request)
        {
            if (!WorkspaceConnections.ContainsKey(request.ConnectionId))
            {
                var data = GetConnectionDataByName(request.ConnectionName);
                var builder = new NpgsqlConnectionStringBuilder(data.ConnectionString);
                builder.ApplicationName = $"{builder.ApplicationName} - {request.UserName}: {request.Id}";
                var connection = data.Connection.CloneWith(builder.ToString());
                await connection.OpenAsync();
                if (request.Schema != "public")
                {
                    await using var cmd = connection.CreateCommand();
                    await cmd.ExecuteAsync($"set search_path to @schema", 
                        new NpgsqlParameter { Value = request.Schema, ParameterName = "schema" });
                    var schema = await cmd.SingleAsync<string>("select current_schema()");
                    if (schema == null)
                    {
                        throw new ArgumentException($"couldn't set search_path to @schema {request.Schema}");
                    }
                }
                WorkspaceConnections.TryAdd(request.ConnectionId, new WorkspaceConnection
                {
                    Id = request.Id,
                    ConnectionId = request.ConnectionId,
                    Connection = connection,
                    Name = request.ConnectionName,
                    Schema = request.Schema,
                    Proxy = request.Proxy
                });
            }
            else
            {
                WorkspaceConnections[request.ConnectionId].Proxy = request.Proxy;
            }
        }

        public WorkspaceConnection GetWsConnection(string connectionId)
        {
            return WorkspaceConnections.TryGetValue(connectionId, out var ws) ? ws : null;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public async ValueTask RemoveWsConnectionAsync(string connectionId)
        {
            if (WorkspaceConnections.TryRemove(connectionId, out var ws))
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
