using Npgsql;

namespace Pgcode.Api
{
    public abstract class DataAccess<T> where T : DataAccess<T>
    {
        private string _userId;
        private readonly ConnectionManager _connectionManager;
        private NpgsqlConnection _connection;

        protected string UserId => _userId ?? throw new ApiException("UserId is not supplied");

        protected DataAccess(ConnectionManager connectionManager)
        {
            _connectionManager = connectionManager;
            _connection = null;
            _userId = null;
        }

        public T ForUserId(string userId)
        {
            if (_userId != null)
            {
                return this as T;
            }
            _userId = userId;
            return this as T;
        }

        protected NpgsqlConnection Connection
        {
            get
            {
                if (_connection != null)
                {
                    return _connection;
                }
                _connection = _connectionManager.GetConnectionByUserId(UserId);
                if (_connection == null)
                {
                    throw new ApiException($"Connection could not be found. ", 404);
                }

                return _connection;
            }
        }
    }
}
