using System;
using System.Collections.Generic;
using System.Linq;
using Npgsql;

namespace Pgcode.Api
{
    public sealed partial class ConnectionManager : IDisposable
    {
        public IEnumerable<ConnectionData> GetConnectionsData() => _connections.Values;

        public NpgsqlConnection GetConnectionByName(string connectionName)
        {
            if (_connections.TryGetValue(connectionName, out var data))
            {
                return data.Connection;
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

        public int GetConnectionIdByUserId(string userId)
        {
            if (ConnectionNamesByUserId.TryGetValue(userId, out var name))
            {
                var result = _connections.Keys.ToList().IndexOf(name);
                if (result == -1)
                {
                    throw new ApiException($"Unknown connection name {name}", 404);
                }

                return result;
            }

            throw new ApiException($"Unknown userId {userId}", 404);
        }

        public NpgsqlConnection GetConnectionByUserId(string userId)
        {
            if (ConnectionNamesByUserId.TryGetValue(userId, out var name))
            {
                return GetConnectionByName(name);
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
