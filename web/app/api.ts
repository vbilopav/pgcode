import {API_INITIAL, publish, SET_APP_STATUS, CONNECTION_SET} from "app/_sys/pubsub";
import "vs/editor/editor.main";
import ICodeEditorViewState = monaco.editor.ICodeEditorViewState;
import INewScrollPosition = monaco.editor.INewScrollPosition;

export const ScriptId: (item: IItem) => string = item  => `${Keys.SCRIPTS}-${item.connection}-${item.schema}-${item.id}`;
export const TableId: (item: IItem) => string = item  => `${Keys.TABLES}-${item.connection}-${item.schema}-${item.id}`;
export const ViewId: (item: IItem) => string = item  => `${Keys.VIEWS}-${item.connection}-${item.schema}-${item.id}`;
export const RoutineId: (item: IItem) => string = item  => `${Keys.ROUTINES}-${item.connection}-${item.schema}-${item.id}`;

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

let _currentSchema: string;
let _currentConnection: string;

export const getCurrentSchema = () => _currentSchema;
export const getCurrentConnection = () => _currentConnection;

const getTimezoneHeader: () => RequestInit = () => {
    return {headers: {"timezone": Intl.DateTimeFormat().resolvedOptions().timeZone}}
};

let _initialResponse: IResponse<IInitialResponse>;
let _connectionNames = new Array<string>();
let _colors = new Array<string>();
_colors[0] = "rgb(255,255,255)";
_colors[1] = "rgb(0,182,192)";
_colors[2] = "rgb(0,255,128)";
_colors[3] = "rgb(128,0,64)";
_colors[4] = "rgb(0,128,0)";
_colors[5] = "rgb(128,128,0)";
_colors[6] = "rgb(255,128,255)";
_colors[7] = "rgb(0,64,0)";
_colors[8] = "rgb(128,128,128)";
_colors[9] = "rgb(255,128,128)";

export const getConnectionColor = (name: string) => {
    const index = _connectionNames.indexOf(name);
    if (index != -1) {
        return _colors[index];
    }
    const i = name.hashCode();
    const c = (i & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

const fetchInitial: () => Promise<IResponse<IInitialResponse>> = async () => _fetchAndPublishStatus<IInitialResponse>("api/initial");

export const initializeApi = async () => {
    _initialResponse = await fetchInitial();
    if (_initialResponse.ok) {
        _connectionNames = _initialResponse.data.connections.map(c => c.name);
    }
    publish(API_INITIAL, _initialResponse);
};

export const connectionIsDefined: (connection: string) => boolean = connection => {
    if (!_initialResponse || !_initialResponse.ok || !_initialResponse.data || !_initialResponse.data.connections || !_initialResponse.data.connections.length) {
        return false;
    }
    return _initialResponse.data.connections.find(c => c.name == connection) ? true : false;
}

export const fetchConnection: (name: string) => Promise<IResponse<IConnectionResponse>> = async name => {
    const result = await _fetchAndPublishStatus<IConnectionResponse>(`api/connection/${name}`, getTimezoneHeader());
    if (!result.data) {
        return result;
    }
    _currentSchema = result.data.schemas.selected;
    _currentConnection = name;
    result.data.connection = name;
    publish(CONNECTION_SET, _currentConnection);
    return result;
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
