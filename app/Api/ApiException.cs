using System;

namespace Pgcode.Api
{
    public class ApiException : Exception
    {
        public readonly int StatusCode;

        public ApiException(string message, int status = 500) : base(message)
        {
            StatusCode = status;
        }
    }
}