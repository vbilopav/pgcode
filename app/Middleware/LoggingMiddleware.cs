using System;
using System.Collections;
using System.Linq;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Npgsql;
using Pgcode.Api;

namespace Pgcode.Middleware
{
    public class LoggingMiddleware : IMiddleware
    {
        private static readonly string NL = Environment.NewLine;

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

        public void LogMessage(HttpContext context, ApiException exception = null, object additional = null)
        {
            var userInfo = context.User.Identity.Name == null ? "" : $"{NL}User: {context.User.Identity.Name}";
            var (statusCode, error, logLevel) = GetStatusCodeErrorAndLogLevel(context, exception);
            string additionalValue = null;
            if (additional != null)
            {
                additionalValue = string.Concat("   ", JsonSerializer.Serialize(additional));
            }
            var msg = $"{context.Request.Path}{context.Request.QueryString} {statusCode}{userInfo}{error}{additionalValue ?? ""}";

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

        private static (int, string, LogLevel) GetStatusCodeErrorAndLogLevel(HttpContext context, ApiException exception)
        {
            return (
                 exception?.StatusCode ?? context.Response.StatusCode,
                 FormatError(exception),
                 exception == null ? LogLevel.Information : LogLevel.Error
                 );
        }

        private static string FormatError(ApiException exception)
        {
            if (exception == null)
            {
                return "";
            }
                
            if (exception.InnerException != null &&
                exception.InnerException is PostgresException postgresException)
            {
                return FormatPostgresExceptionMessage(postgresException);
            }
            
            return $"{NL}{exception.Message}";
        }

        private static string FormatPostgresExceptionMessage(PostgresException e)
        {
            var sb = new StringBuilder();
            sb.Append($"{NL}PostgreSQL error:{NL}");
            foreach (var entry in e.Data.Cast<DictionaryEntry>().Where(entry => entry.Value != null))
            {
                sb.Append($"{NL}{entry.Key}: {entry.Value}");
            }
            sb.Append($"{NL}{NL}");
            return sb.ToString();
        }
    }
}
