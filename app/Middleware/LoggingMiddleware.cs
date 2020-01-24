using System;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Pgcode.Api;

namespace Pgcode.Middleware
{
    public class LoggingMiddleware : IMiddleware
    {
        private readonly ILogger _getLogger;
        private readonly ILogger _postLogger;
        private readonly ILogger _putLogger;
        private readonly ILogger _deleteLogger;

        public LoggingMiddleware(ILoggerFactory loggerFactory)
        {
            _getLogger = loggerFactory.CreateLogger("GET");
            _postLogger = loggerFactory.CreateLogger("POST");
            _putLogger = loggerFactory.CreateLogger("PUT");
            _deleteLogger = loggerFactory.CreateLogger("DELETE");
        }

        public void LogMessage(HttpContext context, ApiException exception = null)
        {
            var userInfo = context.User.Identity.Name == null ? "" : $"{Environment.NewLine}User: {context.User.Identity.Name}";
            var statusCode = exception?.StatusCode ?? context.Response.StatusCode;
            var error = exception == null ? "" : $"{Environment.NewLine}message: {exception.Message}";
            var msg = $"{context.Request.Path}{context.Request.QueryString.ToString()} {statusCode}{userInfo}{error}";
            var logLevel = exception == null ? LogLevel.Information : LogLevel.Error;

            switch (context.Request.Method)
            {
                case "GET":
                    _getLogger.Log(logLevel, msg);
                    break;
                case "POST":
                    _postLogger.Log(logLevel, msg);
                    break;
                case "PUT":
                    _putLogger.Log(logLevel, msg);
                    break;
                case "DELETE":
                    _deleteLogger.Log(logLevel, msg);
                    break;
            }
        }

        public void ProcessHttpContext(HttpContext context) => LogMessage(context);
    }
}
