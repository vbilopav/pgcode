using System.Threading.Tasks;
using Pgcode.DataAccess.Extensions;

namespace Pgcode.DataAccess
{
    public partial class DataAccess
    {
        public async ValueTask<IDataAccess> ExecuteAsync(string command)
        {
            await using var cmd = Connection.CreateCommand();
            SetCommand(cmd, command);
            await Connection.EnsureIsOpenAsync();
            await cmd.ExecuteNonQueryAsync();
            return this;
        }

        public async ValueTask<IDataAccess> ExecuteAsync(string command, params object[] parameters)
        {
            await using var cmd = Connection.CreateCommand();
            SetCommand(cmd, command);
            await Connection.EnsureIsOpenAsync();
            await cmd.AddParameters(parameters).ExecuteNonQueryAsync();
            return this;
        }

        public async ValueTask<IDataAccess> ExecuteAsync(string command, params (string name, object value)[] parameters)
        {
            await using var cmd = Connection.CreateCommand();
            SetCommand(cmd, command);
            await Connection.EnsureIsOpenAsync();
            await cmd.AddParameters(parameters).ExecuteNonQueryAsync();
            return this;
        }
    }
}
