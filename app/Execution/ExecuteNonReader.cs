using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Pgcode.Connection;
using Pgcode.Protos;

namespace Pgcode.Execution
{
    public static partial class ExecuteExtension
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Security", "CA2100:Review SQL queries for security vulnerabilities", Justification = "<Pending>")]
        public static async ValueTask ExecuteNonReaderAsync(
            this WorkspaceConnection ws, 
            ExecuteRequest request, 
            string content,
            CancellationToken cancellationToken = default)
        {
            await using var cmd = ws.Connection.CreateCommand();
            cmd.CommandText = content;
            var stopwatch = new Stopwatch();
            stopwatch.Start();
            var affected = await cmd.ExecuteNonQueryAsync(cancellationToken);
            stopwatch.Stop();
            ws?.Proxy?.SendExecStats(request.Id, stopwatch.Elapsed, affected, cancellationToken);
        }
    }
}
