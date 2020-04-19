using System.Collections.Generic;

namespace Pgcode.ApiModels
{
    public class InitialResponse
    {
        public IEnumerable<ConnectionInfo> Connections { get; set; }
    }
}