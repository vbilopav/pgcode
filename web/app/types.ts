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

interface IInitial { 
    connections: Array<IConnectionInfo>
}

interface IConnectionInfo {
    name: string, 
    version: string,
    host: string, 
    port: number, 
    database: string,
    user: string 
}

export { Position, Themes, AppStatus, IMain, IResponse, IInitial, IConnectionInfo }
