using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components.Forms;

namespace Pgcode.Migrations
{
    public interface IMigration
    {
        string Up(Settings settings);
        string Down(Settings settings);
    }
}
