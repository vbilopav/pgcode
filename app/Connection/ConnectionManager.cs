using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Npgsql;
using Pgcode.Middleware;

namespace Pgcode.Connection
{
    public class AddWorkspaceConnection
    {
        public string ConnectionId { get; set; }
        public string UserName { get; set; }
        public string Id { get; set; }
        public string ConnectionName { get; set; }
        public string Schema { get; set; }
        public IClientProxy Proxy { get; set; }
    }
    
    public sealed partial class ConnectionManager : IDisposable
    {
        private readonly SQLiteConnection _localConnection;

        public ConnectionManager(SQLiteConnection localConnection)
        {
            _localConnection = localConnection;
        }

        public IEnumerable<ConnectionData> GetConnectionsData() => _connections.Values;

        public ConnectionData GetConnectionDataByName(string connectionName)
        {
            if (_connections.TryGetValue(connectionName, out var data))
            {
                return data;
            }
            throw new ApiException($"Unknown connection name {connectionName}", 404);
        }

        public void AddWsConnection(AddWorkspaceConnection request)
        {
            if (!WorkspaceConnections.ContainsKey(request.ConnectionId))
            {
                var data = GetConnectionDataByName(request.ConnectionName);
                var builder = new NpgsqlConnectionStringBuilder(data.ConnectionString);
                builder.ApplicationName = $"{builder.ApplicationName} - {request.UserName}: {request.Id}";
                var connection = data.Connection.CloneWith(builder.ToString());
                connection.Open();
                if (request.Schema != "public")
                {
                    using var cmd = connection.CreateCommand();
                    cmd.Execute($"set search_path to @schema", 
                        new NpgsqlParameter { Value = request.Schema, ParameterName = "schema" });
                    var schema = cmd.Single<string>("select current_schema()");
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

        public void RemoveWsConnection(string connectionId)
        {
            if (!WorkspaceConnections.TryRemove(connectionId, out var ws))
            {
                return;
            }
            ws.Connection.Close();
            ws.Connection.Dispose();
            ws.CleanupWs(_localConnection, false);
        }

        public void Dispose()
        {
            ReleaseUnmanagedResources(_localConnection);
            GC.SuppressFinalize(this);
        }

        ~ConnectionManager()
        {
            ReleaseUnmanagedResources(_localConnection);
        }
    }
}
