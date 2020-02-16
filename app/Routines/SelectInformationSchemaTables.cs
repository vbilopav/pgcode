using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class SelectInformationSchemaTables : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "select_information_schema_tables";
        public const string CommentMarkup = @"

        Returns json array with table names.

        Type of the table: 
        - `BASE TABLE` for a persistent base table (the normal table type)
        - `VIEW` for a view
        - `FOREIGN` for a foreign table
        - `LOCAL TEMPORARY` for a temporary table

        Params:
        - _data->>'type' - type of the table
        - _data->>'schema' - schema name

        ";

        public SelectInformationSchemaTables(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"
       
        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
            select coalesce(json_agg(result.table_name), '[]')
            from (
                select
                    table_name
                from
                    information_schema.tables
                where
                    table_schema = _data->>'schema' and table_type = _data->>'type'
                order by
                    table_name
            ) as result;
        ${Name}$
        language sql security definer stable;
        comment on function {settings.PgCodeSchema}.{Name}(json) is ${Name}_comment${CommentMarkup.Trim()}${Name}_comment$;
        revoke all on function {settings.PgCodeSchema}.{Name}(json) from public;
        grant execute on function {settings.PgCodeSchema}.{Name}(json) to {connection.UserName};

        ");

        public string Down(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        drop function if exists {settings.PgCodeSchema}.{Name}(_data json);

        ");
    }
}