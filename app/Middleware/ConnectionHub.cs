using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Pgcode.Middleware
{
    public abstract class BaseHub : Hub
    {
        protected readonly Settings Settings;
        private readonly CookieMiddleware _cookieMiddleware;
        private readonly ILoggerFactory _loggerFactory;

        protected BaseHub(Settings settings, CookieMiddleware cookieMiddleware, ILoggerFactory loggerFactory)
        {
            Settings = settings;
            _cookieMiddleware = cookieMiddleware;
            _loggerFactory = loggerFactory;
        }

        protected IIdentity GetIdentityAndLogRequest()
        {
            var ctx = this.Context.GetHttpContext();
            var identity = _cookieMiddleware.ProcessCookieAndGetIdentity(ctx);
            if (Settings.LogRequests)
            {
                new LoggingMiddleware(_loggerFactory).LogMessage(ctx);
            }

            return identity;
        }

        protected void LogRequest()
        {
            if (!Settings.LogRequests)
            {
                return;
            }
            var ctx = this.Context.GetHttpContext();
            new LoggingMiddleware(_loggerFactory).LogMessage(ctx);
        }
    }
}
