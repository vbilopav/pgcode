using System;
using System.Collections.Generic;
using System.Linq;
using Npgsql;

namespace Pgcode.Api
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

        public void SetConnectionNameByUserId(string userId, string connectionName)
        {
            if (!_connections.Keys.Contains(connectionName))
            {
                throw new ApiException($"Unknown connection name {connectionName}", 404);
            }
            ConnectionNamesByUserId.AddOrUpdate(userId, connectionName, (key, value) => connectionName);
        }

        public ConnectionData GetConnectionDataByUserId(string userId)
        {
            if (ConnectionNamesByUserId.TryGetValue(userId, out var name))
            {
                return GetConnectionDataByName(name);
            }

            throw new ApiException($"Unknown userId {userId}", 404);
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
