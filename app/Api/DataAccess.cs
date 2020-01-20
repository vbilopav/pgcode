using System.Collections.Generic;
using System.Linq;
using Norm.Extensions;
using Npgsql;

namespace Pgcode.Api
{
    public abstract class DataAccess<T> where T : DataAccess<T>
    {
        private readonly ConnectionManager _connectionManager;
        protected readonly Settings Settings;
        protected NpgsqlConnection Connection;

        protected DataAccess(Settings settings, ConnectionManager connectionManager)
        {
            Settings = settings;
            _connectionManager = connectionManager;
        }

        public T For(string name)
        {
            Connection = _connectionManager.GetConnection(name);
            if (Connection == null)
            {
                throw new DataAccessException($"Connection {name} doesn't exist.", 404);
            }
            return this as T;
        }
    }
}
