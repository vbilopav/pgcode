using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Grpc.Core;
using Pgcode.Protos;

namespace Pgcode.Api
{
    public class TestService : Protos.TestService.TestServiceBase
    {
        public override Task<HelloWorld2Reply> HelloWorld(HelloWorldRequest request, ServerCallContext context)
        {
            return Task.FromResult(new HelloWorld2Reply
            {
                Content = "Hello " + request.Param
            });
        }
    }
}
