﻿using System;
using System.Collections.Generic;
using System.Linq;
using Npgsql;
using Pgcode.Routines;

namespace Pgcode.Migrations
{
    public class Migration1 : IMigration
    {
        public const int Version = 1;

        public IEnumerable<IMigration> Routines => new List<IMigration>
        {
            new GetUserData(Version),
            new SelectInformationSchemaRoutines(Version),
            new SelectInformationSchemaSchemata(Version),
            new SelectInformationSchemaTables(Version),
            new SelectScripts(Version),
            new SetUserData(Version),
            new ApiGetWorkspaceForConnection(Version),
            new ApiGetWorkspace(Version),
            new ApiCreateNewScript(Version),
        };

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
                id varchar not null primary key,
                data jsonb not null default '{{}}',
                timestamp timestamp with time zone not null default (transaction_timestamp() at time zone 'utc')
            );

            create table scripts
            (
                id int not null generated always as identity primary key,
                user_id varchar not null,
                title varchar not null,
                schema varchar null,
                comment varchar null,
                content text not null default '',
                view_state json null,
                timestamp timestamp with time zone not null default (transaction_timestamp() at time zone 'utc')
            );
            
            create index IDX_scripts_user_id on scripts using btree (user_id);
            create unique index IDX_scripts_user_id_title_schema on scripts (user_id, title, schema) where schema is null;

            {string.Join(Environment.NewLine, Routines.Select(m => m.Up(settings, connection)))}

            raise info 'applying migration version %', _version;

            insert into schema_version (version) values (_version) on conflict do nothing;
        end
        $$;

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