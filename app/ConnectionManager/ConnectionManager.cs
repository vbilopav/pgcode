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
            _connections.Values.Select(c => new NameValue {Name = $"{c.Name} v{c.ServerVersion}", Value = c.Name});

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
