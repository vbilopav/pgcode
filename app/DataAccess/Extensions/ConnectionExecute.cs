using System.Data.Common;

namespace Pgcode.DataAccess.Extensions
{
    public static partial class ConnectionExtensions
    {
        public static DbConnection Execute(this DbConnection connection, string command)
        {
            connection.GetDataAccessInstance().Execute(command);
            return connection;
        }

        public static DbConnection Execute(this DbConnection connection, string command, params object[] parameters)
        {
            connection.GetDataAccessInstance().Execute(command, parameters);
            return connection;
        }

        public static DbConnection Execute(this DbConnection connection, string command, params (string name, object value)[] parameters)
        {
            connection.GetDataAccessInstance().Execute(command, parameters);
            return connection;
        }
    }
}
