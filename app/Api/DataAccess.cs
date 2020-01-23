using Npgsql;

namespace Pgcode.Api
{
    public abstract class DataAccess<T> where T : DataAccess<T>
    {
        private string _userId;
        private NpgsqlConnection _connection;

        protected readonly ConnectionManager ConnectionManager;
        protected string UserId => _userId ?? throw new ApiException("UserId is not supplied");

        protected DataAccess(ConnectionManager connectionManager)
        {
            ConnectionManager = connectionManager;
            _connection = null;
            _userId = null;
        }

        public virtual T ForUserId(string userId)
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
                return _connection = ConnectionManager.GetConnectionByUserId(UserId);
            }
        }
    }
}
