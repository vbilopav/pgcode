using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Pgcode.Routines;

namespace Pgcode.Api
{
    public static class TableTypes
    {
        public static string Table => "BASE TABLE";
        public static string View => "VIEW";
        public static string External => "FOREIGN TABLE";
        public static string Temp => "LOCAL TEMPORARY";
    }


    public class ApiAccess : DataAccess<ApiAccess>
    {
        private readonly Settings _settings;

        public ApiAccess(ConnectionManager connectionManager, Settings settings) : base(connectionManager)
        {
            _settings = settings;
        }

        public async ValueTask<ContentResult> GetConnection(string connection, string schema) =>
            await UserConnection.GetContentResultAsync(ApiGetConnection.Name, new
            {
                name = connection,
                schemata = new
                {
                    schema,
                    skipPattern = _settings.SkipSchemaPattern
                },
                scripts = new {
                    schema,
                    userId = UserId
                },
                tables = new
                {
                    schema,
                    type = TableTypes.Table
                },
                views = new
                {
                    schema,
                    type = TableTypes.View
                },
                routines = new
                {
                    schema
                }
            });

        public async ValueTask<ContentResult> GetSchema(string schema) =>
            await UserConnection.GetContentResultAsync(ApiGetSchema.Name, new
            {
                name = schema,
                scripts = new
                {
                    schema,
                    userId = UserId
                },
                tables = new
                {
                    schema,
                    type = TableTypes.Table
                },
                views = new
                {
                    schema,
                    type = TableTypes.View
                },
                routines = new
                {
                    schema
                }
            });

        public async ValueTask<ContentResult> CreateScript(string userId, string schema) =>
            await UserConnection.GetContentResultAsync(ApiCreateScript.Name, new { userId, schema });
    }
}
