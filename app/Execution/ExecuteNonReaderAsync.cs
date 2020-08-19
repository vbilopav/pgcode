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
        public static async ValueTask ExecuteNonReaderAsync(
            this WorkspaceConnection ws,
            string content,
            CancellationToken cancellationToken = default)
        {
            var stopwatch = new Stopwatch();
            await using var cmd = ws.Connection.CreateCommand();
            await ws.CloseCursorIfExists(cmd);
            cmd.CommandText = content;
            stopwatch.Start();
            var rows = await cmd.ExecuteNonQueryAsync(cancellationToken);
            stopwatch.Stop();
            await ws.SendStatsMessageAsync(null, stopwatch.Elapsed, rows, "execution", cancellationToken);
        }
    }
}
