using System;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Pgcode.Api;

namespace Pgcode.Middleware
{
    public static class DevelopmentMiddleware
    {
        public static string DevelopmentPath
        {
            get
            {
                var parts = Directory.GetCurrentDirectory().Split(Path.DirectorySeparatorChar);
                var idx = Array.LastIndexOf(parts, Strings.AppDir);
                parts[idx] = Strings.WebDir;
                return string.Join(Path.DirectorySeparatorChar.ToString(), parts.Take(idx + 1).ToArray());
            }
        }

        public static void UseDevelopmentMiddleware(this IApplicationBuilder app)
        {
            var fileProvider = new PhysicalFileProvider(DevelopmentPath);
            var options = new DefaultFilesOptions();
            options.DefaultFileNames.Clear();
            options.FileProvider = fileProvider;
            options.DefaultFileNames.Add(Strings.DefaultFile);
            app.UseDefaultFiles(options);
            
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = fileProvider,
                RequestPath = new PathString("")
            });
        }
    }
}