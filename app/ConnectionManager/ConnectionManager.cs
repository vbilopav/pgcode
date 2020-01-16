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

        public NpgsqlConnection GetConnection(string name) => _connections.Keys.Contains(name) ? _connections[name].Connection : null;

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
