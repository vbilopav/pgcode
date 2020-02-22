export enum Position { LEFT = "left", RIGHT = "right" };
export enum Themes { DARK = "dark", LIGHT = "light" };
export enum AppStatus { READY = 0, BUSY = 1, ERROR = 2, NO_CONNECTION };

export interface IMain {
    moveToolbar(position: Position, ...args: any[]) : boolean
}

export interface IResponse<T> {
    ok: boolean,
    status: number,
    data?: T
}

export interface IConnectionResponse extends ISchema { 
    name: string,
    schemas: {
        names: Array<string>,
        selected: string
    },
}

export interface ISchemaResponse extends ISchema { 
    name: string
}

export interface ISchema { 
    routines: Array<{
        id: string,
        language: string,
        name: string,
        type: string
    }>,
    scripts: Array<IScriptInfo>,
    tables: Array<string>,
    views: Array<string>
}

export interface IConnectionInfo {
    name: string, 
    version: string,
    host: string, 
    port: number, 
    database: string,
    user: string 
}

export interface IScriptInfo {
    id: string,
    title: string,
    comment: string,
    timestamp: string
}

export interface IScript extends IScriptInfo {
    schema: string,
    content: string,
    viewState: string
}

export interface IInitialResponse { 
    connections: Array<IConnectionInfo>
}

export const keys = {
    scripts: "scripts", 
    tables: "tables", 
    views: "views", 
    routines: "routines", 
    search: "search"
};
