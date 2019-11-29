using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace pgcode
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    //var parts = Directory.GetCurrentDirectory().Split(Path.DirectorySeparatorChar);
                    //parts[^1] = "web";
                    //var path = string.Join(Path.DirectorySeparatorChar.ToString(), parts);
                    //webBuilder.UseWebRoot(path);
                    webBuilder.UseStartup<Startup>();
                });
    }
}
