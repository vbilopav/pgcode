using System.Collections.Generic;

namespace Pgcode.Execution
{
    public class ExecuteResponse
    {
        public string ExecutionTime { get; set; }
        public int RowsAffected { get; set; }
        public string Message { get; set; }
        public IList<Field> Header { get; set; } = null;
    }

    public class Field
    {
        public int Index { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
    }
}