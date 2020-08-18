using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Pgcode.Connection;

namespace Pgcode.Execution
{
    public class ReadStatsMessage
    {
        public string Read { get; set; }
        public string Execution { get; set; }
        public string Total { get; set; }
    }

    public class ExecStatsMessage
    {
        public string Time { get; set; }
        public int Rows { get; set; }
    }

    public static partial class ExecuteExtension
    {
        public static async ValueTask SendReadStats(
            this IClientProxy proxy,
            string id,
            TimeSpan readTime,
            TimeSpan executionTime,
            CancellationToken cancellationToken = default)
        {
            await proxy.SendAsync($"stats-read-{id}", new ReadStatsMessage
            {
                Read = readTime.Format(),
                Execution = executionTime.Format(),
                Total = (executionTime + readTime).Format()
            }, cancellationToken);
        }

        public static async ValueTask SendExecStats(
            this IClientProxy proxy, 
            string id, 
            TimeSpan executionTime, 
            int rows, 
            CancellationToken cancellationToken = default)
        {
            await proxy.SendAsync($"stats-execute-{id}", new ExecStatsMessage
            {
                Time = executionTime.Format(),
                Rows = rows

            }, cancellationToken);
        }
    }
}