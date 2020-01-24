using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components.Forms;
using Npgsql;

namespace Pgcode.Migrations
{
    public interface IMigration
    {
        string Up(Settings settings, NpgsqlConnection connection);
        string Down(Settings settings, NpgsqlConnection connection);
    }
}
