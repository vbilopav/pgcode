using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Pgcode.Api
{
    public class ApiControllerFilter : IActionFilter
    {
        private readonly CookieMiddleware _cookieMiddleware = new CookieMiddleware();

        public void OnActionExecuting(ActionExecutingContext context)
        {
            _cookieMiddleware.ProcessCookieAndAddIdentity(context.HttpContext);
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // Do something after the action executes.
        }
    }
}