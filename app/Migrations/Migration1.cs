using System;
using Norm.Extensions.PostgreSQL;
using Npgsql;

namespace Pgcode.Migrations
{
    public class Migration1 : IMigration
    {
        public const int Version = 1;

        public string Up(Settings settings, NpgsqlConnection connection) => $@"
        do $$
        declare _version int = {Version};
        begin
            set search_path to {settings.PgCodeSchema};

            if current_schema() is null then
                raise info 'creating schema {settings.PgCodeSchema}';

                create schema {settings.PgCodeSchema};
                set search_path to {settings.PgCodeSchema};

                create table if not exists schema_version
                (
                    version int not null primary key,
                    timestamp timestamp with time zone not null default (transaction_timestamp() at time zone 'utc')
                );
            end if;

            if exists(select version from schema_version where version = _version) then
                return;
            end if;

            create table users
            (
                id varchar(64) not null primary key,
                data jsonb not null default '{{}}',
                timestamp timestamp with time zone not null default (transaction_timestamp() at time zone 'utc')
            );

            create table scripts
            (
                id int not null generated always as identity primary key,
                user_id varchar(64) null,
                title varchar(128) not null,
                schema varchar(128) null,
                content text not null default '',
                view_state json null,
                timestamp timestamp with time zone not null default (transaction_timestamp() at time zone 'utc')
            );
            
            create index idx_scripts_user_id on scripts using btree (user_id);

            raise info 'applying migration version %', _version;

            insert into schema_version (version) values (_version) on conflict do nothing;
        end
        $$;

        set search_path to public;

        create function {settings.PgCodeSchema}.get_user_data(_data json) returns text as
        $$
        select 
            data->>(_data->>'key')
        from 
            {settings.PgCodeSchema}.users 
        where 
            id = _data->>'userId';
        $$
        language sql security definer stable;
        comment on function {settings.PgCodeSchema}.get_user_data(json) is 
        $$
        Return user profile value by _data fields ""key"" and ""userId"". Example:
        select {settings.PgCodeSchema}.get_user_data('{{""key"": ""schema"", ""userId"": ""03a3f90d""}}');
        $$;
        revoke all on function {settings.PgCodeSchema}.get_user_data(json) from public;
        grant execute on function {settings.PgCodeSchema}.get_user_data(json) to {connection.UserName};


        create function {settings.PgCodeSchema}.set_user_data(_data json) returns void as
        $$
        declare _now timestamp with time zone;
        begin
            _now := transaction_timestamp() at time zone 'utc';
            
            insert into {settings.PgCodeSchema}.users 
            (
                id, data, timestamp
            )
            values
            (
                _data->>'userId', jsonb_build_object(_data->>'key', _data->>'value'), _now
            )
            on conflict (id) do update
            set
                data = users.data || excluded.data,
                timestamp = _now;
        end
        $$
        language plpgsql security definer volatile;
        comment on function {settings.PgCodeSchema}.set_user_data(json) is 
        $$
        Sets user profile value by _data fields ""value"", ""key"" and ""userId"". Example:
        select {settings.PgCodeSchema}.set_user_data('{{""key"": ""schema"", ""userId"": ""1"", ""value"": ""test1""}}');
        $$;
        revoke all on function {settings.PgCodeSchema}.set_user_data(json) from public;
        grant execute on function {settings.PgCodeSchema}.set_user_data(json) to {connection.UserName};


        create function {settings.PgCodeSchema}.select_information_schema_schemata(_data json default '{{}}') returns json as
        $$
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
        $$
        language sql security definer stable;
        comment on function {settings.PgCodeSchema}.select_information_schema_schemata(json) is 
        $$
        Returns schema names json array filtered by ""skipPattern"" _data value. Example:
        select {settings.PgCodeSchema}.select_information_schema_schemata('{{""skipPattern"": ""(pg_temp|pg_toast)%""}}');
        select {settings.PgCodeSchema}.select_information_schema_schemata();
        $$;
        revoke all on function {settings.PgCodeSchema}.select_information_schema_schemata(json) from public;
        grant execute on function {settings.PgCodeSchema}.select_information_schema_schemata(json) to {connection.UserName};


        create function {settings.PgCodeSchema}.select_information_schema_tables(_data json) returns json as
        $$
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
        $$
        language sql security definer stable;
        comment on function {settings.PgCodeSchema}.select_information_schema_tables(json) is 
        $$
        Returns table names json array by ""type"" and ""schema"" _data values.
        Type of the table: BASE TABLE for a persistent base table (the normal table type), VIEW for a view, FOREIGN for a foreign table, or LOCAL TEMPORARY for a temporary table
        select {settings.PgCodeSchema}.select_information_schema_tables('{{""schema"": ""public"", ""type"": ""BASE TABLE""}}');
        $$;
        revoke all on function {settings.PgCodeSchema}.select_information_schema_tables(json) from public;
        grant execute on function {settings.PgCodeSchema}.select_information_schema_tables(json) to {connection.UserName};


        create function {settings.PgCodeSchema}.select_information_schema_routines(_data json) returns json as
        $$
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
        $$
        language sql security definer stable;
        comment on function {settings.PgCodeSchema}.select_information_schema_routines(json) is 
        $$
        Returns routines data in json array by ""schema"" _data value:
        - id: Uniquely identifies the function in the schema
        - type: FUNCTION for a function, PROCEDURE for a procedure
        - language: The language the function is written in like sql, plpgsql, javascript, etc.
        - name: fully qualified name like ""name(param_type1, param_type2) returns return_type""

        Example:
        select {settings.PgCodeSchema}.select_information_schema_routines('{{""schema"": ""public""}}')
        $$;
        revoke all on function {settings.PgCodeSchema}.select_information_schema_routines(json) from public;
        grant execute on function {settings.PgCodeSchema}.select_information_schema_routines(json) to {connection.UserName};


        create function {settings.PgCodeSchema}.select_scripts(_data json) returns json as
        $$
        select coalesce(json_agg(result), '[]')
        from (
            select 
                id,
                title
            from 
                {settings.PgCodeSchema}.scripts
            where
                (_data->>'schema' is null or schema = _data->>'schema')
                and
                (_data->>'userId' is null or schema = _data->>'userId')
            order by
                title
        ) as result;
        $$
        language sql security definer stable;
        comment on function {settings.PgCodeSchema}.select_scripts(json) is 
        $$
        Returns scripts data (id, title) json array, optionally by ""schema"" or ""userId"" _data values. Example:
        select {settings.PgCodeSchema}.select_scripts('{{""schema"": null, ""userId"": null}}')
        $$;
        revoke all on function {settings.PgCodeSchema}.select_scripts(json) from public;
        grant execute on function {settings.PgCodeSchema}.select_scripts(json) to {connection.UserName};


        create function {settings.PgCodeSchema}.api_get_connection(_data json) returns json as
        $$
        select json_build_object(
            'schemas', json_build_object(
                'names', (select {settings.PgCodeSchema}.select_information_schema_schemata(_data->'schemata')),
                'selected', _data->'schemata'->>'schema'
            ),
            'scripts', (select {settings.PgCodeSchema}.select_scripts(_data->'scripts')),
            'tables', (select {settings.PgCodeSchema}.select_information_schema_tables(_data->'tables')),
            'views', (select {settings.PgCodeSchema}.select_information_schema_tables(_data->'views')),
            'routines', (select {settings.PgCodeSchema}.select_information_schema_routines(_data->'routines'))
        );
        $$
        language sql security definer stable;
        comment on function {settings.PgCodeSchema}.api_get_connection(json) is 
        $$
        Called by GET api/connection/{{connection}}
        Returns json with schemas, scripts, tables, views and routines
        select {settings.PgCodeSchema}.api_get_connection('{{""schemata"": {{""schema"": ""public"", ""skipPattern"": ""(pg_temp|pg_toast)%""}},""scripts"": {{""schema"": null, ""userId"": null}}, ""tables"": {{""schema"": ""public"", ""type"": ""BASE TABLE""}},""views"": {{""schema"": ""public"", ""type"": ""VIEW""}},""routines"": {{""schema"": ""public""}}}}')
        $$;
        revoke all on function {settings.PgCodeSchema}.api_get_connection(json) from public;
        grant execute on function {settings.PgCodeSchema}.api_get_connection(json) to {connection.UserName};


        create function {settings.PgCodeSchema}.api_get_schema(_data json) returns json as
        $$
        select json_build_object(
            'scripts', (select {settings.PgCodeSchema}.select_scripts(_data->'scripts')),
            'tables', (select {settings.PgCodeSchema}.select_information_schema_tables(_data->'tables')),
            'views', (select {settings.PgCodeSchema}.select_information_schema_tables(_data->'views')),
            'routines', (select {settings.PgCodeSchema}.select_information_schema_routines(_data->'routines'))
        );
        $$
        language sql security definer stable;
        comment on function {settings.PgCodeSchema}.api_get_schema(json) is 
        $$
        Called by GET api/schema/{{schema}}
        Returns json with scripts, tables, views and routines
        select {settings.PgCodeSchema}.api_get_schema('{{""scripts"": {{""schema"": null, ""userId"": null}}, ""tables"": {{""schema"": ""public"", ""type"": ""BASE TABLE""}},""views"": {{""schema"": ""public"", ""type"": ""VIEW""}},""routines"": {{""schema"": ""public""}}}}')
        $$;
        revoke all on function {settings.PgCodeSchema}.api_get_schema(json) from public;
        grant execute on function {settings.PgCodeSchema}.api_get_schema(json) to {connection.UserName};
        ";

        public string Down(Settings settings, NpgsqlConnection connection) => $@"
        do $$
        declare _version int = {Version};
        begin
        
            drop schema {settings.PgCodeSchema} cascade;
            raise info 'migration % down', _version;

        end
        $$;
        ";
    }
}