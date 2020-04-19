using System;

namespace Pgcode.ApiModels
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
}