import scripts from "./ui/side-panel/scripts"

enum Position { LEFT = "left", RIGHT = "right" };
enum Themes { DARK = "dark", LIGHT = "light" };
enum AppStatus { READY = 0, BUSY = 1, ERROR = 2, NO_CONNECTION };

interface IMain {
    moveToolbar(position: Position, ...args: any[]) : boolean
}

interface IResponse<T> {
    ok: boolean,
    status: number,
    data?: T
}

interface IInitialResponse { 
    connections: Array<IConnectionInfo>
}

interface IWsConnectionResponse extends IWorkspace { 
    name: string,
    schemas: {
        names: Array<string>,
        selected: string
    },
}

interface IWorkspaceResponse extends IWorkspace { 
    name: string
}

interface IWorkspace { 
    routines: Array<{
        id: string,
        language: string,
        name: string,
        type: string
    }>,
    scripts: Array<{
        id: string,
        title: string,
        comment: string,
    }>,
    tables: Array<string>,
    views: Array<string>
}

interface IConnectionInfo {
    name: string, 
    version: string,
    host: string, 
    port: number, 
    database: string,
    user: string 
}

interface IInitialResponse { 
    connections: Array<IConnectionInfo>
}

const keys = {
    scripts: "scripts", 
    tables: "tables", 
    views: "views", 
    routines: "routines", 
    search: "search"
};

export { 
    Position, 
    Themes, 
    AppStatus, 
    IMain, 
    IResponse, 
    IInitialResponse, 
    IWsConnectionResponse,
    IWorkspaceResponse,
    IWorkspace,
    IConnectionInfo,
    keys
}
