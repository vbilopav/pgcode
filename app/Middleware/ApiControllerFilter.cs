using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using Pgcode.Api;

namespace Pgcode.Middleware
{
    public class ApiControllerFilter : IActionFilter
    {
        private readonly Settings _settings;
        private readonly CookieMiddleware _cookieMiddleware = new CookieMiddleware();
        private readonly LoggingMiddleware _loggingMiddleware;

        public ApiControllerFilter(ILoggerFactory loggerFactory, Settings settings)
        {
            _settings = settings;
            _loggingMiddleware = new LoggingMiddleware(loggerFactory);
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            _cookieMiddleware.ProcessCookieAndAddIdentity(context.HttpContext);
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            var exception = context.Exception as ApiException;
            if (exception is null && context.Exception is Npgsql.PostgresException postgresException)
            {
                exception = new ApiException("PostgresException", postgresException);
            }

            if (exception != null)
            {
                context.Result = new ObjectResult(null) {StatusCode = exception.StatusCode};
                context.ExceptionHandled = true; 
                _loggingMiddleware.LogMessage(context.HttpContext, exception);
            }

            else if (_settings.LogRequests)
            {
                _loggingMiddleware.LogMessage(context.HttpContext);
            }
        }
    }
}