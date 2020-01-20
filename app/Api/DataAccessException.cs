using System;

namespace Pgcode.Api
{
    public class DataAccessException : Exception
    {
        public readonly int StatusCode = 500;

        public DataAccessException(string message) : base(message) { }

        public DataAccessException(string message, int status) : base(message)
        {
            StatusCode = status;
        }
    }
}