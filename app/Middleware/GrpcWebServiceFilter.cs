using System;
using System.Threading.Tasks;
using Grpc.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Pgcode.Middleware
{
    public class GrpcWebServiceFilter
    {
        private readonly CookieMiddleware _cookieMiddleware;
        private readonly Settings _settings;
        private readonly LoggingMiddleware _loggingMiddleware;

        public GrpcWebServiceFilter(CookieMiddleware cookieMiddleware, ILoggerFactory loggerFactory, Settings settings)
        {
            _cookieMiddleware = cookieMiddleware;
            _settings = settings;
            _loggingMiddleware = new LoggingMiddleware(loggerFactory);
        }

        public Task<TReplay> Run<TReplay>(ServerCallContext context, Func<HttpContext, Task<TReplay>> func)  where TReplay : class, new()
        {
            var ctx = context.GetHttpContext();
            _cookieMiddleware.ProcessCookieAndAddIdentity(ctx);
            if (_settings.LogRequests)
            {
                _loggingMiddleware.LogMessage(ctx);
            }
            try
            {
                return func(ctx);
            }
            catch (Exception e)
            {
                var exception = e as ApiException;
                if (exception is null && e is Npgsql.PostgresException postgresException)
                {
                    exception = new ApiException(postgresException.Message, postgresException);
                }
                exception ??= new ApiException($"Error calling service {context.Method}: {e.Message}", e);

                context.Status = new Status(GrpcStatusCode(exception.StatusCode), exception.Message);
                ctx.Response.StatusCode = exception.StatusCode;
                _loggingMiddleware.LogMessage(ctx, exception);

                return Task.FromResult(new TReplay());
            }
        }

        private StatusCode GrpcStatusCode(int code) => code switch
        {
            StatusCodes.Status404NotFound => StatusCode.NotFound,
            StatusCodes.Status403Forbidden => StatusCode.Unauthenticated,
            StatusCodes.Status401Unauthorized => StatusCode.PermissionDenied,
            StatusCodes.Status503ServiceUnavailable => StatusCode.Unavailable,
            StatusCodes.Status501NotImplemented => StatusCode.Unimplemented,
            _ => StatusCode.Internal
        };
    }
}