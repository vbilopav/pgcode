using System;
using System.Data.SQLite;
using System.IO;
using System.IO.Compression;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Pgcode.Api;
using Pgcode.Connection;
using Pgcode.Middleware;

namespace Pgcode
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddGrpc(o =>
            {
                o.ResponseCompressionLevel = CompressionLevel.NoCompression;
            });
            services.AddSignalR(o =>
            {
                o.ClientTimeoutInterval = TimeSpan.MaxValue;
            });

            services.AddSingleton<SQLiteConnection>(provider =>
            {
                var file = Path.Join(Directory.GetCurrentDirectory(), Program.Settings.LocalDb);
                if (File.Exists(file))
                {
                    File.Delete(file);
                }
                var connection = new SQLiteConnection(new SQLiteConnectionStringBuilder {DataSource = file}.ToString());
                connection.Open();
                using var command = connection.CreateCommand();
                command.Execute("PRAGMA synchronous = OFF; PRAGMA journal_mode = MEMORY;");
                return connection;
            });
            services.AddSingleton<ConnectionManager, ConnectionManager>();
            services.AddSingleton(Program.Settings);
            services.AddSingleton<CookieMiddleware, CookieMiddleware>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory)
        {
            app.UseRouting();
            app.UseGrpcWeb();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGrpcService<DataService>().EnableGrpcWeb();
                endpoints.MapHub<ConnectionsHub>("/connectionsHub");
                endpoints.MapHub<ExecuteHub>("/executeHub", o =>
                {
                    o.LongPolling.PollTimeout = TimeSpan.MaxValue;
                });
            });

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

            if (Program.Settings.LogPgCodeCommandNotice || Program.Settings.LogPgCodeDbCommands)
            {
                ConnectionManager.AddLoggers(loggerFactory);
            }

            if (Program.Settings.LogPgCodeCommandNotice)
            {
                ConnectionManager.AddNoticeHandlersToConnections(loggerFactory);
            }

            app.UseHttpsRedirection();
        }
    }
}