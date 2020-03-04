export enum Position { LEFT = "left", RIGHT = "right" };
export enum Themes { DARK = "dark", LIGHT = "light" };
export enum AppStatus { READY = 0, BUSY = 1, ERROR = 2, NO_CONNECTION };
export enum Keys { SCRIPTS = "scripts", TABLES = "tables", VIEWS = "views", ROUTINES = "routines", SEARCH = "search" };

export interface IMain {
    moveToolbar(position: Position, ...args: any[]) : boolean
}

export interface ISidePanel {
    unselectAll() : void
}
