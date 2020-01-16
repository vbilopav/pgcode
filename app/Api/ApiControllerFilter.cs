using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace Pgcode.Api
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
            if (_settings.LogRequests)
            {
                _loggingMiddleware.ProcessHttpContext(context.HttpContext);
            }
        }
    }
}