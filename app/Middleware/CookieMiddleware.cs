using System;
using System.Security.Claims;
using System.Security.Principal;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Pgcode.Api;

namespace Pgcode.Middleware
{
    public class CookieUserProfileModel
    {
        public string User { get; set; }
    }

    public class CookieMiddleware : IMiddleware
    {
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            IgnoreNullValues = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        private static readonly CookieOptions CookieOptions = new CookieOptions
        {
            IsEssential = true,
            Path = "/",
            Expires = DateTime.UtcNow.AddYears(1)
        };

        public CookieUserProfileModel ProcessCookie(HttpContext context)
        {
            var cookieModel = context.Request.Cookies.TryGetValue(Program.CookieName, out var value)
                ? JsonSerializer.Deserialize<CookieUserProfileModel>(value, JsonOptions)
                : new CookieUserProfileModel();

            if (Program.Settings.RunAsUser != null)
            {
                cookieModel.User = Program.Settings.RunAsUser;
            }

            if (string.IsNullOrEmpty(cookieModel.User))
            {
                cookieModel.User = $"{Guid.NewGuid().ToString().Substring(0, 8)}";
            }

            return cookieModel;
        }

        public ClaimsIdentity ProcessCookieAndGetIdentity(HttpContext context)
        {
            var cookieModel = ProcessCookie(context);
            return new GenericIdentity(cookieModel.User);
        }

        public void ProcessCookieAndAddIdentity(HttpContext context)
        {
            var cookieModel = ProcessCookie(context);
            context.User = new ClaimsPrincipal();
            context.User.AddIdentity(new GenericIdentity(cookieModel.User));
            context.Response.Cookies.Append(Program.CookieName, JsonSerializer.Serialize(cookieModel, JsonOptions), CookieOptions);
        }

        public void ProcessHttpContext(HttpContext context)
        {
            if (context.Request.Path != "/")
            {
                return;
            }

            ProcessCookieAndAddIdentity(context);
        }
    }
}
