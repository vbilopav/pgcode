export enum Position { LEFT = "left", RIGHT = "right" };
export enum Themes { DARK = "dark", LIGHT = "light" };
export enum AppStatus { READY = 0, BUSY = 1, ERROR = 2, NO_CONNECTION };

export interface IMain {
    moveToolbar(position: Position, ...args: any[]) : boolean
}

export const keys = {
    scripts: "scripts", 
    tables: "tables", 
    views: "views", 
    routines: "routines", 
    search: "search"
};

export enum EditorType { SCRIPT = 0 };
