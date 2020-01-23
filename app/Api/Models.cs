using System.Collections.Generic;
using Npgsql;

namespace Pgcode.Api
{
    public class ConnectionData
    {
        public int? SchemaVersion { get; set; }
        public string ServerVersion { get; set; }
        public string Name { get; set; }
        public NpgsqlConnection Connection { get; set; }
    }

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
