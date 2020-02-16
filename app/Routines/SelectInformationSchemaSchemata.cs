using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class SelectInformationSchemaSchemata : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "select_information_schema_schemata";
        public const string CommentMarkup = @"
        
        Returns schema names json array filtered by `skipPattern`

        Params:
        - _data->>'skipPattern' - skip pattern not similiar to

        ";

        public SelectInformationSchemaSchemata(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"

        create or replace function {settings.PgCodeSchema}.{Name}(_data json default '{{}}') returns json as
        ${Name}$
            select coalesce(json_agg(result.schema_name), '[]')
            from (
                select
                    schema_name
                from
                    information_schema.schemata
                where 
                    _data->>'skipPattern' is null or schema_name not similar to _data->>'skipPattern'
                order by
                    schema_name
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