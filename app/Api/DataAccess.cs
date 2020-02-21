using Npgsql;

namespace Pgcode.Api
{
    public abstract class DataAccess<T> where T : DataAccess<T>
    {
        private string _userId;
        private ConnectionData _connectionData;

        protected readonly ConnectionManager ConnectionManager;
        protected string UserId => _userId ?? throw new ApiException("UserId is not supplied");

        protected DataAccess(ConnectionManager connectionManager)
        {
            ConnectionManager = connectionManager;
            _connectionData = null;
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

        protected ConnectionData UserConnection
        {
            get
            {
                if (_connectionData != null)
                {
                    return _connectionData;
                }
                return _connectionData = ConnectionManager.GetConnectionDataByUserId(UserId);
            }
        }
    }
}
