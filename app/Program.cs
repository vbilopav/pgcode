using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Pgcode
{
    public static class Program
    { 
#if DEBUG
        public const bool IsDebug = true;
#else
        public const bool IsDebug = false;
#endif
        public static IWebHostEnvironment Environment { get; private set; }
        public static Settings Settings { get; private set; }

        public static async Task Main(string[] args)
        {
            if (args.Contains("-h") || args.Contains("--help"))
            {
                PrintHelp();
                return;
            }

            PrintStartMessages();

            //
            // see source code for default config
            // https://github.com/aspnet/AspNetCore/tree/master/src/DefaultBuilder/src
            //

            var builder = new WebHostBuilder();
            var configBuilder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
                .AddCommandLine(args)
                .AddEnvironmentVariables("PGCODE_");

            Settings = new Settings();
            var config = configBuilder.Build();
            //config.GetConnectionString()
            config.Bind(Settings);

            builder
                .UseSetting("URLS", $"http://{Settings.Address}:{Settings.Port}")
                .ConfigureAppConfiguration((ctx, config) =>
                {
                    var env = ctx.HostingEnvironment;
                    env.EnvironmentName = IsDebug ? "Development" : "Production";
                    Environment = env;
                    if (env.IsDevelopment())
                    {
                        config.AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true, reloadOnChange: false);
                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.WriteLine("Development build, serving from: {0}", DevelopmentMiddleware.DevelopmentPath);
                        Console.ResetColor();
                    }
                })
                .ConfigureLogging((ctx, logging) => logging.AddConsole()
                    .AddFilter("Microsoft", LogLevel.Information).AddFilter("System", LogLevel.Information)
                    .AddFilter("Microsoft", LogLevel.Warning).AddFilter("System", LogLevel.Warning))
                .UseKestrel()
                .ConfigureServices((ctx, services) => services.AddRouting())
                .SuppressStatusMessages(true)
                .CaptureStartupErrors(true)
                .UseStartup<Startup>();

            var host = builder.Build();

            var url = PrintAvailableUrlsFromHost(host);
            if (url == null)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("ERROR: listening port is not configured properly");
                Console.ResetColor();
                return;
            }
            Console.WriteLine("Hit CTRL-C to stop the server");
            if (args.Contains("-o") || args.Contains("--open") || Environment.IsDevelopment())
            {
                OpenDefaultBrowser(url);
            }
            await host.RunAsync();
        }

        public static void PrintHelp()
        {
            Console.WriteLine("");
            Console.WriteLine("Usage: pgcode [options]");
            Console.ForegroundColor = ConsoleColor.Green;
            Console.Write("  --port=[port]");
            Console.ResetColor();
            Console.WriteLine("              Port to use [5000]");

            Console.ForegroundColor = ConsoleColor.Green;
            Console.Write("  --address=[address]");
            Console.ResetColor();
            Console.WriteLine("        Address to use [localhost]");

            Console.ForegroundColor = ConsoleColor.Green;
            Console.Write("  --connection=[connection]");
            Console.ResetColor();
            Console.WriteLine("  Connection name to use in this instance");

            Console.WriteLine("");
            Console.WriteLine("Additional options:");

            Console.ForegroundColor = ConsoleColor.Green;
            Console.Write("  -o --open");
            Console.ResetColor();
            Console.WriteLine("                  Try to open default browser window after starting the server");

            Console.ForegroundColor = ConsoleColor.Green;
            Console.Write("  -h --help");
            Console.ResetColor();
            Console.WriteLine("                  Print this list and exit.");

            Console.WriteLine("");
            Console.ForegroundColor = ConsoleColor.Gray;
            Console.WriteLine("Note: ");

            Console.WriteLine("Key/values above can be set in appsettings.json file in root folder. Also, as environment variables with PGCODE_ prefix.");
            Console.WriteLine("For multiple configuration sources, order of precedence is: 1) environment variables 2) command line arguments 3) configuration file.");
            Console.WriteLine("");
            Console.ResetColor();
        }

        public static void PrintStartMessages()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("Starting up pgcode ...");
            Console.ResetColor();
        }

        public static string PrintAvailableUrlsFromHost(IWebHost host)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("Listening on: ");
            string firstUrl = null;
            foreach (var address in host.ServerFeatures.Get<IServerAddressesFeature>().Addresses)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine(" {0}", address);
                if (firstUrl == null)
                {
                    firstUrl = address;
                }
            }
            Console.ResetColor();
            return firstUrl;
        }

        public static void OpenDefaultBrowser(string url)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("Launching default browser...");
            Console.ResetColor();
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                // TODO: Unhandled exception. System.ComponentModel.Win32Exception (2): No such file or directory
                Process.Start("xdg-open", url);
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                Process.Start("open", url);
            }
        }
    }

    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            Services.Configure(services);
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseRouting();

            if (env.IsDevelopment())
            {
                app.UseDevelopmentMiddleware();
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseResourceMiddleware();
            }
        }
    }
}
