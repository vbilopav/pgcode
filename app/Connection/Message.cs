using System;
using Npgsql;

namespace Pgcode.Connection
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

        public string ConstraintName { get; }
        public string DataTypeName { get; }
        public string ColumnName { get; }
        public string TableName { get; }
        public string SchemaName { get; }
        public string Where { get; }
        public string InternalQuery { get; }
        public int Position { get; }
        public string Line { get; }
        public string Hint { get; }
        public string Detail { get; }
        public string MessageText { get; }
        public string SqlState { get; }
        public string Severity { get; }
        public string Routine { get; }
        public string Time { get; }
    }
}
