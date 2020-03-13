using Npgsql;
using Pgcode.Migrations;

namespace Pgcode.Routines
{
    public class SelectRoutines : IMigration
    {
        private readonly int _forVersion;
        public const int Version = 1;
        public const string Name = "select_routines";
        public const string CommentMarkup = @"

        Returns json array with routine info with elements:
        - id
        - type
        - language
        - name
        - return type
        - comment

        Params:
        - _data->>'schema' - schema name

        ";

        public SelectRoutines(int forVersion)
        {
            _forVersion = forVersion;
        }

        public string Up(Settings settings, NpgsqlConnection connection) => (_forVersion != Version ? "" : $@"
       
        create or replace function {settings.PgCodeSchema}.{Name}(_data json) returns json as
        ${Name}$
            select coalesce(json_agg(result), '[]')
            from (

                select
                    proc.oid as id,
                    r.routine_type as type,
                    r.external_language as language,
                    r.routine_name as routine,
                    r.routine_name || 
                        '(' || 
                        array_to_string(
                            array_agg(
                                case    when p.parameter_mode = 'IN' 
                                        then '' else lower(p.parameter_mode) || ' ' 
                                end || coalesce(case when p.data_type = 'ARRAY' then regexp_replace(p.udt_name, '^[_]', '')  || '[]' else p.data_type end, '')
                                order by p.ordinal_position
                            ), 
                            ', '
                        ) ||
                        ')' as name,
                        
                    case    when    r.data_type = 'USER-DEFINED' and 
                                    r.type_udt_catalog is not null and 
                                    r.type_udt_schema is not null and 
                                    r.type_udt_name is not null 
                            then 'setof ' || r.type_udt_name
                            else r.data_type
                    end as returns,
                    
                    pgdesc.description as comment

                from 
                    information_schema.routines r
                    left outer join information_schema.parameters p 
                    on r.specific_name = p.specific_name and r.specific_schema = p.specific_schema
                    
                    inner join pg_catalog.pg_proc proc on r.routine_name = proc.proname
                    left outer join pg_catalog.pg_description pgdesc on proc.oid = pgdesc.objoid

                where
                    r.specific_schema = _data->>'schema'
                    and r.external_language <> 'INTERNAL'

                group by
                    proc.oid, r.routine_type, r.external_language, r.routine_name, 
                    r.data_type, r.type_udt_catalog, r.type_udt_schema, r.type_udt_name, 
                    pgdesc.description

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