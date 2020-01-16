namespace Pgcode
{
    public class Settings
    {
        public int Port { get; set; } = 5000;
        public string Host { get; set; } = "localhost";
        public string RunAsUser { get; set; } = null;
        public string PgCodeSchema { get; set; } = "pgcode";
        public string DefaultSchema { get; set; } = "public";
        public string[] SkipSchemaStartingWith { get; set; } = { "pg_toast", "pg_temp" };
        public bool LogRequests { get; set; } = true;
        public string WindowsOpenCommand { get; set; } = null;
        public string OsxOpenCommand { get; set; } = "open";
        public string LinuxOpenCommand { get; set; } = "xdg-open";
        public string FreeBsdOpenCommand { get; set; } = "xdg-open";
    }
}