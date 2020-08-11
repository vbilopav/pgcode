using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Google.Protobuf;
using Grpc.Core;
using Pgcode.Connection;
using Pgcode.Middleware;
using Pgcode.Migrations._1.Routines;
using Pgcode.Protos;

namespace Pgcode.Api
{
    public class ConnectionService : Protos.ConnectionService.ConnectionServiceBase
    {
        /*
        private readonly GrpcWebServiceFilter _filter;
        private readonly ConnectionManager _connectionManager;
        private readonly Settings _settings;

        public ConnectionService(GrpcWebServiceFilter filter, ConnectionManager connectionManager, Settings settings)
        {
            _filter = filter;
            _connectionManager = connectionManager;
            _settings = settings;
        }

        public override Task<GetInitialReply> GetInitial(EmptyRequest request, ServerCallContext context)
        {
            return _filter.Run(context, http =>
            {
                var replay = new GetInitialReply
                {
                    User = http.User.Identity.Name,
                    Version = Program.Version
                };
                replay.Connections.Add(_connectionManager
                    .GetConnectionsData()
                    .OrderBy(c => c.Name)
                    .Select(c => new ConnectionInfo
                    {
                        Name = c.Name,
                        Version = c.ServerVersion,
                        Host = c.Connection.Host,
                        Port = c.Connection.Port,
                        Database = c.Connection.Database,
                        User = c.Connection.UserName
                    }));
                return Task.FromResult(replay);
            });
        }

        public override Task<ContentReply> GetConnection(GetConnectionRequest request, ServerCallContext context)
        {
            return _filter.Run(context, http =>
            {
                var result = _connectionManager.GetConnectionDataByName(request.Connection).LockAndGetString(ApiGetConnection.Name,
                    new
                    {
                        userId = http.User.Identity.Name,
                        defaultSchema = _settings.DefaultSchema,
                        timezone = request.Timezone,
                        skipSchemaPattern = _settings.SkipSchemaPattern
                    });

                return Task.FromResult(new ContentReply
                {
                    Content = ByteString.CopyFromUtf8(result)
                });
            });
        }
        */
    }
}
