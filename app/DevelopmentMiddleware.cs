using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;

namespace pgcode
{
    public static class DevelopmentMiddleware
    {
        public static void UseDevelopmentMiddleware(this IApplicationBuilder app)
        {
            var parts = Directory.GetCurrentDirectory().Split(Path.DirectorySeparatorChar);
            parts[^1] = "web";
            var path = string.Join(Path.DirectorySeparatorChar.ToString(), parts);
            var fileProvider = new PhysicalFileProvider(path);
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
}
