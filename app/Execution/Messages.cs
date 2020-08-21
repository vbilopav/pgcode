using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Npgsql;
using Pgcode.Connection;

namespace Pgcode.Execution
{
    public class StatsMessage
    {
        public string Read { get; set; }
        public string Execution { get; set; }
        public string Total { get; set; }
        public int RowsAffected { get; set; }
        public uint RowsFetched { get; set; }
        public string Message { get; set; }
    }

    public class Message
    {
        public Message(PostgresNotice e)
        {
            ConstraintName = e.ConstraintName;
            DataTypeName = e.DataTypeName;
            ColumnName = e.ColumnName;
            TableName = e.TableName;
            SchemaName = e.SchemaName;
            Where = e.Where;
            InternalQuery = e.InternalQuery;
            Position = e.Position;
            Line = e.Line;
            Hint = e.Hint;
            Detail = e.Detail;
            MessageText = e.MessageText;
            SqlState = e.SqlState;
            Severity = e.Severity;
            Routine = e.Routine;
        }

        public Message(PostgresException e, TimeSpan time)
        {
            ConstraintName = e.ConstraintName;
            DataTypeName = e.DataTypeName;
            ColumnName = e.ColumnName;
            TableName = e.TableName;
            SchemaName = e.SchemaName;
            Where = e.Where;
            InternalQuery = e.InternalQuery;
            Position = e.Position;
            Line = e.Line;
            Hint = e.Hint;
            Detail = e.Detail;
            MessageText = e.MessageText;
            SqlState = e.SqlState;
            Severity = e.Severity;
            Routine = e.Routine;
            Time = time.Format();
        }

        public string ConstraintName { get; set; }
        public string DataTypeName { get; set; }
        public string ColumnName { get; set; }
        public string TableName { get; set; }
        public string SchemaName { get; set; }
        public string Where { get; set; }
        public string InternalQuery { get; set; }
        public int Position { get; set; }
        public string Line { get; set; }
        public string Hint { get; set; }
        public string Detail { get; set; }
        public string MessageText { get; set; }
        public string SqlState { get; set; }
        public string Severity { get; set; }
        public string Routine { get; set; }
        public string Time { get; set; }
    }

    public static partial class ExecuteExtension
    {
        public static async ValueTask SendStatsMessageAsync(
            this WorkspaceConnection ws,
            TimeSpan? readTime,
            TimeSpan executionTime,
            int rowsAffected,
            uint rowsFetched,
            string message,
            CancellationToken cancellationToken = default)
        {
            await ws.Proxy.SendAsync($"stats-{ws.Id}", new StatsMessage
            {
                Read = readTime?.Format(),
                Execution = executionTime.Format(),
                Total = readTime != null ? (executionTime + readTime.Value).Format() : executionTime.Format(),
                RowsAffected = rowsAffected,
                RowsFetched = rowsFetched,
                Message = message
            }, cancellationToken);
        }

        public static async ValueTask SendPgNoticeAsync(
            this WorkspaceConnection ws,
            PostgresNotice notice,
            CancellationToken cancellationToken = default)
        {
            await ws.SendPgMessageInternalAsync(new Message(notice), cancellationToken);
        }

        public static async ValueTask SendPgErrorAsync(
            this WorkspaceConnection ws,
            PostgresException e, 
            TimeSpan time,
            CancellationToken cancellationToken = default)
        {
            var message = new Message(e, time);
            if (ws.ErrorOffset.HasValue && message.Position != 0)
            {
                message.Position -= ws.ErrorOffset.Value;
            }
            await ws.SendPgMessageInternalAsync(message, cancellationToken);
        }

        private static async ValueTask SendPgMessageInternalAsync(
            this WorkspaceConnection ws, 
            Message message, 
            CancellationToken cancellationToken = default)
        {
            await ws.Proxy.SendAsync($"message-{ws.Id}", message, cancellationToken);
        }
    }
}