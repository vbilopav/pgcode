﻿using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

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

        public async ValueTask<ContentResult> GetConnectionContentResult(string connection, string schema) =>
            await UserConnection.GetContentResultAsync("api_get_connection", new
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

        public async ValueTask<ContentResult> GetSchemaContentResult(string schema) =>
            await UserConnection.GetContentResultAsync("api_get_schema", new
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
    }
}
