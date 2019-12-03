using Pgcode.DataAccess.Extensions;

namespace Pgcode.DataAccess
{
    public partial class DataAccess
    {
        public DataAccess Execute(string command)
        {
            using var cmd = Connection.CreateCommand();
            SetCommand(cmd, command);
            Connection.EnsureIsOpen();
            cmd.ExecuteNonQuery();
            return this;
        }

        public DataAccess Execute(string command, params object[] parameters)
        {
            using var cmd = Connection.CreateCommand();
            SetCommand(cmd, command);
            Connection.EnsureIsOpen();
            cmd.AddParameters(parameters).ExecuteNonQuery();
            return this;
        }

        public DataAccess Execute(string command, params (string name, object value)[] parameters)
        {
            using var cmd = Connection.CreateCommand();
            SetCommand(cmd, command);
            Connection.EnsureIsOpen();
            cmd.AddParameters(parameters).ExecuteNonQuery();
            return this;
        }
    }
}
