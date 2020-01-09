using System;
using System.Collections.Generic;
using System.Linq;
using Pgcode.Api;

namespace Pgcode
{
    public sealed partial class ConnectionManager : IDisposable
    {
        public ConnectionManager()
        {
        }

        public IEnumerable<ConnectionInfo> GetConnectionsDataNameValue() =>
            _connections.Values.OrderBy(c => c.Name).Select(c => 
                new ConnectionInfo
                {
                    Name = c.Name,
                    Version = c.ServerVersion,
                    Host = c.Connection.Host,
                    Port = c.Connection.Port,
                    Database = c.Connection.Database,
                    User = c.Connection.UserName
                });

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
