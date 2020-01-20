using System.Collections.Generic;
using System.Linq;
using Norm.Extensions;

namespace Pgcode.Api
{
    public class InformationSchema : DataAccess<InformationSchema>
    {
        public InformationSchema(Settings settings, ConnectionManager connectionManager) : base(settings, connectionManager)
        {
        }

        public IAsyncEnumerable<string> GetSchemasAsync() => Connection.ReadAsync<string>(@"

            select
                schema_name 
            from
                information_schema.schemata

        ").Where(s => Settings.SkipSchemaStartingWith.All(skip => !s.StartsWith(skip)));
    }
}
