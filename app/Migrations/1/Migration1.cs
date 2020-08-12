using System;
using System.Collections.Generic;
using System.Linq;
using Npgsql;
using Pgcode.Migrations._1.Routines;
using Pgcode.Migrations._1.Tables;
using HashCode = Pgcode.Migrations._1.Routines.HashCode;

namespace Pgcode.Migrations._1
{
    public class Migration1 : IMigration
    {
        public const int Version = 1;

        public IEnumerable<IMigration> Routines => new List<IMigration>
        {
            new HashCode(Version),
            new MaxStr(Version),
            new SelectRoutines(Version),
            new SelectSchemata(Version),
            new SelectTables(Version),
            new SelectScripts(Version),
            new ApiGetConnection(Version),
            new ApiGetSchema(Version),
            new ApiCreateScript(Version),
            new GetProfileValue(Version),
            new ApiGetScriptContent(Version),
            new ApiSaveScript(Version),
            new ApiSaveScriptScrollPosition(Version),
            new ApiCheckItemExists(Version)
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

                {new SchemaVersion(Version).Up(settings, connection)}
            end if;

            if exists(select version from schema_version where version = _version) then
                return;
            end if;

            {new Users(Version).Up(settings, connection)}
            {new Scripts(Version).Up(settings, connection)}

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