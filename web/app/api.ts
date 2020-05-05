import {API_INITIAL, publish, SET_APP_STATUS} from "app/_sys/pubsub";
import "vs/editor/editor.main";
import ICodeEditorViewState = monaco.editor.ICodeEditorViewState;
import INewScrollPosition = monaco.editor.INewScrollPosition;

export const ScriptId: (id: number) => string = id  => `${Keys.SCRIPTS}${id}`;
export const TableId: (id: number) => string = id  => `${Keys.TABLES}${id}`;
export const ViewId: (id: number) => string = id  => `${Keys.VIEWS}${id}`;
export const RoutineId: (id: number) => string = id  => `${Keys.ROUTINES}${id}`;

export const classes = {active: "active", sticky: "sticky", docked: "docked"};

export enum Position { LEFT = "left", RIGHT = "right" }
export enum Themes { DARK = "dark", LIGHT = "light" }
export enum AppStatus { READY = 0, BUSY = 1, ERROR = 2, NO_CONNECTION }
export enum Keys { SCRIPTS = "scripts", TABLES = "tables", VIEWS = "views", ROUTINES = "routines", SEARCH = "search" }
export enum Languages { PGSQL = "pgsql" }

export interface IMain {
    moveToolbar(position: Position, ...args: any[]) : boolean
}

export interface ISidePanel {
    unselectAll() : void
}

export interface IResponse<T> {
    ok: boolean,
    status: number,
    data?: T
}

interface IConnectionResponse extends ISchema { 
    schemas: {
        names: Array<string>,
        selected: string
    }
}

interface ISchemaResponse extends ISchema { 
    name: string,
}

export interface ISchema { 
    routines: Array<IRoutineInfo>,
    scripts: Array<IScriptInfo>,
    tables: Array<ITableInfo>,
    views: Array<ITableInfo>,
    connection: string
}

export interface ITableInfo extends IItem {
    estimate: number
}

export interface IRoutineInfo extends IItem {
    type: string
    language: string,
    returns: string,
}

export interface IScriptInfo extends IItem {
    timestamp: string
}

export interface IItem {
    id: number,
    name: string,
    schema: string,
    connection: string,
    comment: string,
}

interface IScript extends IScriptInfo, IScriptContent {}

export interface IScriptContent {
    content: string,
    viewState?: ICodeEditorViewState
    scrollPosition?: INewScrollPosition
}

export interface IInitialResponse { 
    connections: Array<IConnectionInfo>,
    user: string
}

export interface IConnectionInfo {
    name: string, 
    version: string,
    host: string, 
    port: number, 
    database: string,
    user: string 
}

export type ItemInfoType = IRoutineInfo | IScriptInfo | ITableInfo;

const _createResponse:<T> (response: Response, data?: T) => IResponse<T> = (response, data) => 
    Object({ok: response.ok, status: response.status, data: data});

const _fetchAndPublishStatus:<T> (url: string, init?: RequestInit) => Promise<IResponse<T>> = async (url, init) => {
    publish(SET_APP_STATUS, AppStatus.BUSY);
    try {
        const response = await fetch(url, init);
        if (!response.ok) {
            publish(SET_APP_STATUS, AppStatus.ERROR, response.status);
            return _createResponse(response);
        }
        return _createResponse(response, await response.json());
    } catch (error) {
        publish(SET_APP_STATUS, AppStatus.ERROR, error.message);
        throw error;
    }
};

const _fetch:<T> (url: string, init?: RequestInit) => Promise<IResponse<T>> = async (url, init) => {
    const response = await fetch(url, init);
    if (!response.ok) {
        return _createResponse(response);
    }
    return _createResponse(response, await response.json());
};

let _currentSchema;
let _currentConnection;

export const getCurrentSchema = () => _currentSchema;
export const getCurrentConnection = () => _currentConnection;

const getTimezoneHeader: () => RequestInit = () => {
    return {headers: {"timezone": Intl.DateTimeFormat().resolvedOptions().timeZone}}
};

const fetchInitial: () => Promise<IResponse<IInitialResponse>> = async () => _fetchAndPublishStatus<IInitialResponse>("api/initial");

export const fetchConnection: (name: string) => Promise<IResponse<IConnectionResponse>> = async name => {
    const result = await _fetchAndPublishStatus<IConnectionResponse>(`api/connection/${name}`, getTimezoneHeader());
    if (!result.data) {
        return result;
    }
    _currentSchema = result.data.schemas.selected;
    _currentConnection = name;
    result.data.connection = name;
    return result;
};

export const initializeApi = async () => {
    const initial = await fetchInitial();
    publish(API_INITIAL, initial);
};

export const fetchSchema: (schema: string) => Promise<IResponse<ISchemaResponse>> = async schema => {
    const result = await _fetchAndPublishStatus<ISchemaResponse>(`api/schema/${getCurrentConnection()}/${schema}`);
    if (!result.data) {
        return null;
    }
    _currentSchema = result.data.name;
    result.data.connection = getCurrentConnection();
    return result;
};

export const createScript: () => Promise<IResponse<IScript>> = async () => {
    const result = await _fetch<IScript>(`api/script-create/${getCurrentConnection()}/${getCurrentSchema()}`);
    if (!result.data) {
        return null;
    }
    result.data.connection = getCurrentConnection();
    result.data.schema = getCurrentSchema();
    return result;
};

export const fetchScriptContent: (connection: string, id: number) => Promise<IResponse<IScriptContent>> = (connection, id) => 
    _fetch(`api/script-content/${connection}/${id}`);

export const saveScriptContent: (connection: string, id: number, content: string, viewState: string) => 
    Promise<IResponse<string>> = async (connection, id, content, viewState) => 
    await _fetch<string>(`api/script-content/${connection}/${id}/${encodeURIComponent(viewState)}`, {
        method: 'POST',
        headers: {
            "Accept": "text/plain",
            "Content-Type": "text/plain",
            "_null-content": content === null ? "1" : "",
            "_null-view-state": viewState === null ? "1" : ""
        },
        body: content
    });


export const saveScriptScrollPosition: (connection: string, id: number, scrollTop?: number, scrollLeft?: number) => 
    Promise<IResponse<string>> = async  (connection, id, scrollTop, scrollLeft) => {

    return await _fetch<string>(`api/script-scroll-position/${connection}`, {
        method: 'POST',
        headers: {
            "Accept": "application/json; charset=UTF-8",
            "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({id, scrollTop, scrollLeft})
    });
}
