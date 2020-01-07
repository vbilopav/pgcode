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

        public IEnumerable<NameValue> GetConnectionsDataNameValue() =>
            _connections.Values.OrderBy(c => c.Name).Select(c => 
                new NameValue 
                {
                    Name = c.Name,
                    Value = 
                        $"Version={c.ServerVersion}, Host={c.Connection.Host}, Port={c.Connection.Port}, Database={c.Connection.Database}, User={c.Connection.UserName}"
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
