using System;
using System.Security.Claims;
using System.Security.Principal;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Pgcode
{
    public class CookieUserProfileModel
    {
        public string User { get; set; }
    }

    public static class CookieMiddleware
    {
        public const string CookieName = "pgcode";

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
            Expires = DateTime.UtcNow.AddDays(30)
        };

        public static void UseCookieMiddleware(this IApplicationBuilder app)
        {
            app.Use(async (context, next) =>
            {
                if (context.Request.Path == "/")
                {
                    CookieUserProfileModel cookieModel;
                    if (context.Request.Cookies.TryGetValue(CookieName, out var value))
                    {
                        cookieModel = JsonSerializer.Deserialize<CookieUserProfileModel>(value, JsonOptions);

                        //
                        // TODO update current profile for a change
                        //
                    }
                    else
                    {
                        cookieModel = new CookieUserProfileModel();
                        if (string.IsNullOrEmpty(cookieModel.User))
                        {
                            cookieModel.User = $"{Guid.NewGuid().ToString().Substring(0, 8)}";
                        }
                    }

                    if (!string.IsNullOrEmpty(Program.Settings.RunAsUser))
                    {
                        cookieModel.User = Program.Settings.RunAsUser;
                    }
                    context.User = new ClaimsPrincipal();
                    context.User.AddIdentity(new GenericIdentity(cookieModel.User));
                    context.Response.Cookies.Append(CookieName, JsonSerializer.Serialize(cookieModel, JsonOptions), CookieOptions);

                }
                await next.Invoke();
            });
        }
    }
}
