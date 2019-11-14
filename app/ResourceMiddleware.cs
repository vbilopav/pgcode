using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Mime;
using System.Reflection;
using System.Resources;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Primitives;

namespace pgcode
{
    public static class ResourceMiddleware
    {
        private static readonly ResourceManager Manager =
            new ResourceManager("pgcode.Properties.Resources", Assembly.GetExecutingAssembly());

        private static readonly Dictionary<string, (string resource, string type)> Maps =
            new Dictionary<string, (string resource, string type)>
            {
                {"/", ("/index.html", "text/html; charset=UTF-8")},
                {"/css/theme-dark.css", (null, "text/css; charset=UTF-8")},
                {"/app/index.js", (null, "application/javascript; charset=UTF-8")},
                {"/libs/monaco-editor/min/vs/editor/editor.main.js", (null, "application/javascript; charset=UTF-8")},
                {"/libs/monaco-editor/min/vs/editor/editor.main.css", (null, "text/css; charset=UTF-8")},
                {"/libs/monaco-editor/min/vs/editor/editor.main.nls.js", (null, "application/javascript; charset=UTF-8")},
                {"/libs/monaco-editor/min/vs/basic-languages/pgsql/pgsql.js", (null, "application/javascript; charset=UTF-8")},
                {"/libs/monaco-editor/min/vs/base/worker/workerMain.js", (null, "application/javascript; charset=UTF-8")},
            };

        public static void UseResourceMiddleware(this IApplicationBuilder app)
        {
            app.UseEndpoints(endpoints =>
            {
                foreach (var (key, value) in Maps)
                {
                    endpoints.MapGet(key, async context =>
                    {
                        var (resource, type) = value;
                        var resourceKey = resource ?? key;
                        context.Response.Headers.Add("content-type", new StringValues(type));
                        context.Response.Headers.Add("cache-control", new StringValues("max-age=3600"));
                        context.Response.Headers.Add("Connection", new StringValues("keep-alive"));

                        var content = Manager.GetString(resourceKey);
                        var size = System.Text.Encoding.Default.GetByteCount(content);
                        context.Response.Headers.Add("content-length", new StringValues(size.ToString()));
                        
                        await context.Response.WriteAsync(content);
                    });
                }
            });
        }
    }
}
