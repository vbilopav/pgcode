using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

namespace Pgcode.Api
{
    [Route("connections")]
    public class Connections : Controller
    {
        [HttpGet]
        public object Get()
        {
            return new
            {
                connection = new[] { "value1", "value2" },
                selected = "value1"
            };
        }
    }
}
