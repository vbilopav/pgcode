namespace Pgcode
{
    public enum ExecutionMode { Cursor, Local, Mixed }

    public class Settings
    {
        public int Port { get; set; } = 80;
        public string Host { get; set; } = "localhost";
        public string RunAsUser { get; set; } = null;
        public string MinimalPgVersion { get; set; } = "9.5";
        public string ConnectionApplicationName { get; set; } = "pgcode";
        public string PgCodeSchema { get; set; } = "pgcode";
        public string DefaultSchema { get; set; } = "public";
        public string SkipSchemaPattern { get; set; } = "(pg_temp|pg_toast)%";
        public bool LogRequests { get; set; } = false;
        public bool LogPgCodeDbCommands { get; set; } = true;
        public bool LogPgCodeCommandNotice { get; set; } = true;
        public string OpenCommandUrl { get; set; } = null; //"https://pgcode";
        public string WindowsOpenCommand { get; set; } = null;
        public string OsxOpenCommand { get; set; } = "open";
        public string LinuxOpenCommand { get; set; } = "xdg-open";
        public string FreeBsdOpenCommand { get; set; } = "xdg-open";
        public string LocalDb { get; set; } = "pgcode.db";
        public ExecutionMode ExecutionMode { get; set; } = ExecutionMode.Mixed;
        public int MixedModeSyncLimit { get; set; } = 500;
    }
}