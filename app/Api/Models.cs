using System.Collections.Generic;

namespace Pgcode.Api
{
    public class InitialResponse
    {
        public IEnumerable<ConnectionInfo> Connections { get; set; }
    }

    public class ConnectionResponse
    {
        public Schemas Schemas { get; set; }
    }

    public class Schemas
    {
        public IEnumerable<string> Names { get; set; }
        public string Selected { get; set; }
    }

    public class ConnectionInfo
    {
        public string Name { get; set; }
        public string Version { get; set; }
        public string Host { get; set; }
        public int Port { get; set; }
        public string Database { get; set; }
        public string User { get; set; }
    }
}
