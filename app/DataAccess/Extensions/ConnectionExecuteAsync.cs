using System.Data.Common;
using System.Threading.Tasks;

namespace Pgcode.DataAccess.Extensions
{
    public static partial class ConnectionExtensions
    {
        public static async ValueTask<DbConnection> ExecuteAsync(this DbConnection connection, string command)
        {
            await connection.GetDataAccessInstance().ExecuteAsync(command);
            return connection;
        }

        public static async ValueTask<DbConnection> ExecuteAsync(this DbConnection connection, string command, params object[] parameters)
        {
            await connection.GetDataAccessInstance().ExecuteAsync(command, parameters);
            return connection;
        }

        public static async ValueTask<DbConnection> ExecuteAsync(this DbConnection connection, string command, params (string name, object value)[] parameters)
        {
            await connection.GetDataAccessInstance().ExecuteAsync(command, parameters);
            return connection;
        }
    }
}
