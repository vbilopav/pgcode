namespace Pgcode.Connection
{
    public class WorkspaceKey
    {
        public string ConnectionId { get; set; }
        public string UserName { get; set; }
        public string Id { get; set; }
        public int GetKey() => ConnectionId.GetHashCode() ^ UserName.GetHashCode() ^ Id.GetHashCode();
    }
}