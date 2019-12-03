namespace Pgcode
{
    public class Settings
    {
        public int Port { get; set; } = 5000;
        public string Address { get; set; } = "localhost";
        public string Connection { get; set; }
        public string RunAsUser { get; set; }
    }
}