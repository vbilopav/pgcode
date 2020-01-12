using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Pgcode
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();
            services.AddSingleton<ConnectionManager, ConnectionManager>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory)
        {
            app.UseRouting();
            app.UseEndpoints(endpoints => endpoints.MapControllers());

            IMiddleware cookieMiddleware = new CookieMiddleware();
            IMiddleware loggingMiddleware = new LoggingMiddleware(loggerFactory);

            if (env.IsDevelopment())
            {
                cookieMiddleware.Use(app);
                if (Program.Settings.LogRequests)
                {
                    loggingMiddleware.Use(app);
                }
                app.UseDevelopmentMiddleware();
                app.UseDeveloperExceptionPage();
            }
            else
            {
                if (Program.Settings.LogRequests)
                {
                    app.UseResourceMiddleware(cookieMiddleware, loggingMiddleware);
                }
                else
                {
                    app.UseResourceMiddleware(cookieMiddleware);
                }
            }
        }
    }
}