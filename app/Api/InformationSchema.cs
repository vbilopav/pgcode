using System.Collections.Generic;
using System.Linq;
using Norm.Extensions;

namespace Pgcode.Api
{
    public class TableTypes
    {
        public string Table => "BASE TABLE";
        public string View => "VIEW";
        public string External => "FOREIGN TABLE";
        public string Temp => "LOCAL TEMPORARY";
    }


    public class InformationSchema : DataAccess<InformationSchema>
    {
        private readonly Settings _settings;

        public InformationSchema(Settings settings, ConnectionManager connectionManager, UserProfile profile) : base(connectionManager)
        {
            _settings = settings;
        }

        public IAsyncEnumerable<string> GetSchemaNamesAsync() => Connection.ReadAsync<string>(@"

            select
                schema_name 
            from
                information_schema.schemata

        ").Where(s => _settings.SkipSchemaStartingWith.All(skip => !s.StartsWith(skip)));

        private IAsyncEnumerable<string> GetTableNamesByTypeAsync(string type) => Connection.ReadAsync<string>(@"
            select
                table_name
            from
                information_schema.tables
            where
                table_schema = 'public' and table_type = 'BASE TABLE'
            order by
                table_name
        ");
    }
}
