using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Pgcode.Connection;

namespace Pgcode.Execution
{
    public static partial class ExecuteExtension
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security",
            "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static async ValueTask ExecuteAsync(
            this WorkspaceConnection ws,
            string content,
            CancellationToken cancellationToken = default)
        {
            var stopwatch = new Stopwatch();
            await using var cmd = ws.Connection.CreateCommand();
            cmd.CommandText = content;
            stopwatch.Start();
            var rowsAffected = await cmd.ExecuteAsync(content, cancellationToken: cancellationToken);
            stopwatch.Stop();
            await ws.SendStatsMessageAsync(new MessageRequest
            {
                ExecutionTime = stopwatch.Elapsed,
                RowsAffected = rowsAffected,
                RowsFetched = 0,
                Message = "execution"
            }, cancellationToken);
        }
    }
}
