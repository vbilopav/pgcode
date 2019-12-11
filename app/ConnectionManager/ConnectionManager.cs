using System;

namespace Pgcode
{
    public sealed partial class ConnectionManager : IDisposable
    {
        public ConnectionManager()
        {
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
