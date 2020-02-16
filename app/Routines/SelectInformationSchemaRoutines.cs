using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class SelectInformationSchemaRoutines : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "select_information_schema_routines";
        public const string CommentMarkup = @"

        Returns json array with routine info with elements:
        - id
        - type
        - external_language
        - routine_name

        Params:
        - _data->>'schema' - schema name

        ";

        public SelectInformationSchemaRoutines(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"
       
        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
            select coalesce(json_agg(result), '[]')
            from (

                select
                    r.specific_name as id,
                    r.routine_type as type,
                    r.external_language as language,
                    r.routine_name || '(' || array_to_string(array_agg(
                        case when p.parameter_mode = 'IN' then '' else lower(p.parameter_mode) || ' ' end || coalesce(p.data_type, '')
                        order by p.ordinal_position
                    ), ', ')  || ')' || ' returns ' || 
                    case when 
                            r.data_type = 'USER-DEFINED' and 
                            r.type_udt_catalog is not null and 
                            r.type_udt_schema is not null and 
                            r.type_udt_name is not null 
                        then 'setof ' || r.type_udt_name
                        else r.data_type
                    end as name

                from 
                    information_schema.routines r
                    left outer join information_schema.parameters p 
                    on r.specific_name = p.specific_name and r.specific_schema = p.specific_schema

                where
                    r.specific_schema = _data->>'schema'
                    and r.external_language <> 'INTERNAL'

                group by
                    r.specific_name, r.routine_type, r.external_language, r.routine_name, 
                    r.data_type, r.type_udt_catalog, r.type_udt_schema, r.type_udt_name

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