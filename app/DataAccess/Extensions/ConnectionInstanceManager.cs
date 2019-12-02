using System.Data;
using System.Data.Common;
using System.Runtime.CompilerServices;
using System.Text.Json;

namespace Pgcode.DataAccess.Extensions
{
    public static partial class ConnectionExtensions
    {
        private static readonly ConditionalWeakTable<DbConnection, DataAccess> Table;
        static ConnectionExtensions()
        {
            Table = new ConditionalWeakTable<DbConnection, DataAccess>();
        }

        internal static DataAccess GetDataAccessInstance(this DbConnection connection)
        {
            if (Table.TryGetValue(connection, out var instance))
            {
                return instance;
            }
            instance = new DataAccess(connection);
            Table.Add(connection, instance);
            return instance;
        }

        public static DbConnection As(this DbConnection connection, CommandType type)
        {
            var instance = connection.GetDataAccessInstance();
            instance.As(type);
            return connection;
        }

        public static DbConnection AsProcedure(this DbConnection connection) => connection.As(CommandType.StoredProcedure);

        public static DbConnection AsText(this DbConnection connection) => connection.As(CommandType.Text);

        public static DbConnection Timeout(this DbConnection connection, int? timeout)
        {
            var instance = connection.GetDataAccessInstance();
            instance.Timeout(timeout);
            return connection;
        }
    }
}
