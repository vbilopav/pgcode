using System;
using Norm.Extensions.PostgreSQL;

namespace Pgcode.Migrations
{
    public class Migration1 : IMigration
    {
        public const int Version = 1;

        public string Up(Settings settings) => Sql.Script(@$"

            {Sql.SearchPathSchema(settings.PgCodeSchema)};

            if ({Sql.CurrentSchema}) is null then
                {Sql.Info($"creating schema {settings.PgCodeSchema}")};
                
                create schema {settings.PgCodeSchema};
                {Sql.SearchPathSchema(settings.PgCodeSchema)};
                
                create table if not exists schema_version
                (
                    version int not null primary key,
                    timestamp timestamp with time zone not null default (transaction_timestamp() at time zone 'utc')
                );
            end if;
            
            if exists(select version from schema_version where version = _version) then
                {Sql.Info($"schema version {Version} is up to date")};
                return;
            end if;
            
            create table users
            (
                id varchar(64) not null primary key,
                data json not null default '{{}}'
            );

            create table scripts
            (
                id int not null generated always as identity primary key,
                title varchar(128) not null default '',
                schema varchar(128) not null default 'public',
                content text not null default '',
                view_state json null
            );

            insert into schema_version (version) values (_version) on conflict do nothing;

            {Sql.Info("migration % up", "_version")};
        
        ", 
            ("_version int", Version));

        public string Down(Settings settings) => Sql.Script(@$"
        
            drop schema {settings.PgCodeSchema} cascade;
            {Sql.Info("migration % down", "_version")};

        ",
            ("_version int", Version));


        /*
public string Up(Settings settings) => @$"
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
       data json not null default '{{}}'
   );

   create table scripts
   (
       id int not null generated always as identity primary key,
       title varchar(128) not null default '',
       schema varchar(128) not null default 'public',
       content text not null default '',
       view_state json null
   );

   insert into schema_version (version) values (_version) on conflict do nothing;

   raise info 'migration % up', _version;
end
$$;
";
          */
        /*
        public string Down(Settings settings) => @$"
        do $$
        declare _version int = {Version};
        begin
            drop schema {settings.PgCodeSchema} cascade;
            raise info 'migration % down', _version;
        end
        $$;";
        */
    }
}