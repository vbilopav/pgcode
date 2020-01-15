using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Pgcode
{
    public interface IMiddleware
    {
        void Use(IApplicationBuilder app) => app.Use(async (context, next) => 
        {
            ProcessHttpContext(context);
            await next.Invoke();
        });

        void ProcessHttpContext(HttpContext context);
    }
}