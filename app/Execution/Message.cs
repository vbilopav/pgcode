using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Npgsql;
using Pgcode.Connection;

namespace Pgcode.Execution
{
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

        public Message(PostgresException e)
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
    }

    public static class MessagesExtension
    {
        public static void SendPgNotice(this WorkspaceConnection ws, PostgresNotice notice)
        {
            ws.Proxy.SendAsync($"notice-{ws.Id}", new Message(notice)).GetAwaiter().GetResult();
        }

        public static void SendPgError(this WorkspaceConnection ws, PostgresException e)
        {
            var message = new Message(e);
            if (ws.ErrorOffset.HasValue && message.Position != 0)
            {
                message.Position -= ws.ErrorOffset.Value;
            }
            ws.Proxy.SendAsync($"error-{ws.Id}", message).GetAwaiter().GetResult();
        }
    }
}