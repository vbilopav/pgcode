using System;
using System.Collections.Generic;
using System.Threading;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Pgcode.Api
{
    public class ApiException : Exception
    {
        public readonly int StatusCode;

        public ApiException(string message, int status = 500) : base(message)
        {
            StatusCode = status;
        }

        public ApiException(string message, Exception innerException, int status = 500) : base(message, innerException)
        {
            StatusCode = status;
        }
    }

    public class ConnectionData
    {
        public int? SchemaVersion { get; set; }
        public string ServerVersion { get; set; }
        public string Name { get; set; }
        public NpgsqlConnection Connection { get; set; }
        public ILogger Logger { get; set; }
    }

    public class InitialResponse
    {
        public IEnumerable<ConnectionInfo> Connections { get; set; }
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
