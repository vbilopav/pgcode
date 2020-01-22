using System;
using System.Collections.Generic;
using System.Linq;
using Npgsql;

namespace Pgcode
{
    public sealed partial class ConnectionManager : IDisposable
    {
        public ConnectionManager() { }

        public IEnumerable<ConnectionData> GetConnectionsData() => _connections.Values;

        public NpgsqlConnection GetConnectionByName(string connectionName) => 
            _connections.Keys.Contains(connectionName) ? _connections[connectionName].Connection : null;

        public bool SetConnectionNameByUserId(string userId, string connectionName)
        {
            if (!_connections.Keys.Contains(connectionName))
            {
                return false;
            }
            ConnectionNamesByUserId.AddOrUpdate(userId, connectionName, (key, value) => connectionName);
            return true;
        }

        public NpgsqlConnection GetConnectionByUserId(string userId) => 
            GetConnectionByName(ConnectionNamesByUserId[userId]);

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
