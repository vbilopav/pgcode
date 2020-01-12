using System;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Pgcode
{
    public class LoggingMiddleware : IMiddleware
    {
        private readonly ILogger _logger;

        public LoggingMiddleware(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger("HttpContext");
        }

        public void ProcessHttpContext(HttpContext context)
        {
            var userInfo = context.User.Identity.Name == null ? "" : $"\t{context.User.Identity.Name}";
            _logger.LogInformation($"{context.Request.Method} {context.Request.Path}{context.Request.QueryString.ToString()}{userInfo}");
        }
    }
}
