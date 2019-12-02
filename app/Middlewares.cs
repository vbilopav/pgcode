using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Resources;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Primitives;

namespace Pgcode
{
    public static class DevelopmentMiddleware
    {
        public static string DevelopmentPath
        {
            get
            {
                var parts = Directory.GetCurrentDirectory().Split(Path.DirectorySeparatorChar);
                var idx = Array.LastIndexOf(parts, "app");
                parts[idx] = "web";
                return string.Join(Path.DirectorySeparatorChar.ToString(), parts.Take(idx + 1).ToArray());
            }
        }

        public static void UseDevelopmentMiddleware(this IApplicationBuilder app)
        {
            var fileProvider = new PhysicalFileProvider(DevelopmentPath);
            var options = new DefaultFilesOptions();
            options.DefaultFileNames.Clear();
            options.FileProvider = fileProvider;
            options.DefaultFileNames.Add("index.html");
            app.UseDefaultFiles(options);

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = fileProvider,
                RequestPath = new PathString("")
            });
        }
    }

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
            "/favicon.ico",
            "/fonts/icons.woff2"
        };

        private static readonly Dictionary<string, (string resourceId, string mimeType, string size, bool isBinary)> Maps = 
            new Dictionary<string, (string, string, string, bool)>();

        static ResourceMiddleware()
        {
            foreach (var key in EndpointKeys)
            {
                var resourceId = key == "/" ? "/index.html" : key;
                var (mimeType, isBinary) = resourceId.Split('.').Last() switch
                {
                    "html" => ("text/html; charset=UTF-8", false),
                    "css" => ("text/css; charset=UTF-8", false),
                    "js" => ("application/javascript; charset=UTF-8", false),
                    "ico" => ("image/x-icon; charset=UTF-8", true),
                    "woff2" => ("font/woff2; charset=UTF-8", true),
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

        public static void UseResourceMiddleware(this IApplicationBuilder app)
        {
            app.UseEndpoints(endpoints =>
            {
                foreach (var (key, value) in Maps)
                {
                    endpoints.MapGet(key, async context =>
                    {
                        var (resourceId, mimeType, size, isBinary) = value;

                        context.Response.Headers.Add("content-type", new StringValues(mimeType));
                        context.Response.Headers.Add("cache-control", new StringValues("max-age=3600"));
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
