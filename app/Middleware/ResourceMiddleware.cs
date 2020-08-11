using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Resources;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Pgcode.Api;

namespace Pgcode.Middleware
{
    public static class ResourceMiddleware
    {
        private static readonly Assembly ExecutingAssembly = Assembly.GetExecutingAssembly();

        private static readonly string Etag = $"W/\"{ExecutingAssembly.GetName().Version}\"";

        private static readonly ResourceManager Manager = new ResourceManager("pgcode.Properties.Resources", ExecutingAssembly);

        private static readonly List<string> EndpointKeys = new List<string>
        {
            "/",
            "/css/theme-dark.css",
            "/css/theme-light.css",
            "/js/index.js",
            "/libs/monaco-editor/min/vs/editor/editor.main.js",
            "/libs/monaco-editor/min/vs/editor/editor.main.css",
            "/libs/monaco-editor/min/vs/editor/editor.main.nls.js",
            "/libs/monaco-editor/min/vs/basic-languages/pgsql/pgsql.js",
            "/libs/monaco-editor/min/vs/base/worker/workerMain.js",
            "/libs/monaco-editor/min/vs/base/browser/ui/codiconLabel/codicon/codicon.ttf",
            "/favicon.ico",
            "/fonts/icons.woff2",
            //"/manifest.json",
            //"/postgresql-512.png"
        };

        private static readonly Dictionary<string, (string resourceId, string mimeType, string size, bool isBinary)> Maps = 
            new Dictionary<string, (string, string, string, bool)>();

        static ResourceMiddleware()
        {
            foreach (var key in EndpointKeys)
            {
                var resourceId = key == "/" ? $"/{Program.DefaultFile}" : key;
                var (mimeType, isBinary) = resourceId.Split('.').Last() switch
                {
                    "html" => (Program.HtmlContentType, false),
                    "css" => (Program.CssContentType, false),
                    "js" => (Program.JsContentType, false),
                    "ico" => (Program.IcoContentType, true),
                    "woff2" => (Program.Woff2ContentType, true),
                    "json" => (key == "/manifest.json" ? Program.ManifestContentType : Program.JsonContentType, false),
                    "png" => (Program.PngContentType, true),
                    "ttf" => (Program.TtfContentType, true),
                    _ => throw new NotSupportedException()
                };
                if (isBinary)
                {
                    if (!(Manager.GetObject(resourceId) is byte[] content))
                    {
                        throw new NotSupportedException(key);
                    }
                    Maps[key] = (resourceId, mimeType, content.Length.ToString(), true);
                }
                else
                {
                    var content = Manager.GetString(resourceId);
                    var size = System.Text.Encoding.Default.GetByteCount(content);
                    Maps[key] = (resourceId, mimeType, size.ToString(), false);
                }
            }
        }

        public static void UseResourceMiddleware(this IApplicationBuilder app, params IMiddleware[] mws)
        {
            app.UseEndpoints(endpoints =>
            {
                foreach (var (key, value) in Maps)
                {
                    endpoints.MapGet(key, async context =>
                    {
                        foreach (var middleware in mws)
                        {
                            middleware.ProcessHttpContext(context);
                        }

                        var (resourceId, mimeType, size, isBinary) = value;

                        context.Response.Headers.Add("content-type", new StringValues(mimeType));
                        if (key == "/")
                        {
                            context.Response.Headers.Add("cache-control", new StringValues(new []{"no-cache", "no-store", "must-revalidate" }));
                            context.Response.Headers.Add("Expires", new StringValues("0"));
                        }
                        else
                        {
                            context.Response.Headers.Add("cache-control", new StringValues("max-age=3600"));
                        }
                        context.Response.Headers.Add("Connection", new StringValues("keep-alive"));
                        context.Response.Headers.Add("content-length", new StringValues(size));
                        context.Response.Headers.Add("etag", new StringValues(Etag));

                        if (!isBinary)
                        {
                            await context.Response.WriteAsync(Manager.GetString(resourceId));
                        }
                        else
                        { 
                            await context.Response.BodyWriter.WriteAsync(Manager.GetObject(resourceId) as byte[]);
                            await context.Response.BodyWriter.FlushAsync();
                        }
                    });
                }
            });
        }
    }
}