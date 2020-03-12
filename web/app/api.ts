import { publish, SET_APP_STATUS } from "app/_sys/pubsub";
import { AppStatus, Keys } from "app/types";

export const ScriptId: (id: number) => string = id  => `${Keys.SCRIPTS}${id}`;
export const TableId: (id: number) => string = id  => `${Keys.TABLES}${id}`;
export const ViewId: (id: number) => string = id  => `${Keys.VIEWS}${id}`;
export const RoutineId: (id: number) => string = id  => `${Keys.ROUTINES}${id}`;

interface IResponse<T> {
    ok: boolean,
    status: number,
    data?: T
}

interface IConnectionResponse extends ISchema { 
    schemas: {
        names: Array<string>,
        selected: string
    },
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
    id: number,
    name: string,
    estimate: number,
    comment: string
}

export interface IRoutineInfo extends IItem {
    id: number,
    type: string
    language: string,
    name: string,
    signature: string,
    returns: string,
    comment: string
}

export interface IScriptInfo extends IItem {
    id: number,
    title: string,
    schema: string,
    comment: string,
    timestamp: string
}

export interface IItem {
    schema: string,
    connection: string
}

interface IScript extends IScriptInfo, IScriptContent {}

interface IScriptContent {
    content: string,
    viewState: string
}

interface IInitialResponse { 
    connections: Array<IConnectionInfo>
}

export interface IConnectionInfo {
    name: string, 
    version: string,
    host: string, 
    port: number, 
    database: string,
    user: string 
}

const _createResponse:<T> (response: Response, data?: T) => IResponse<T> = (response, data) => Object({ok: response.ok, status: response.status, data: data});

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
}

const _fetch:<T> (url: string) => Promise<IResponse<T>> = async url => {
    const response = await fetch(url);
    if (!response.ok) {
        return _createResponse(response);
    }
    return _createResponse(response, await response.json());
}

let _currentSchema;
let _currentConnection;

const getCurrentSchema = () => _currentSchema;
const getCurrentConnection = () => _currentSchema;

const getTimezoneHeader: () => RequestInit = () => {
    return {headers: {"timezone": Intl.DateTimeFormat().resolvedOptions().timeZone}}
};

export const fetchInitial: () => Promise<IResponse<IInitialResponse>> = async () => 
    _fetchAndPublishStatus<IInitialResponse>("api/initial");

export const fetchConnection: (name: string) => Promise<IResponse<IConnectionResponse>> = async name => {
    const result = await _fetchAndPublishStatus<IConnectionResponse>(`api/connection/${name}`, getTimezoneHeader());
    if (!result.data) {
        return null;
    }
    _currentSchema = result.data.schemas.selected;
    _currentConnection = name;
    result.data.connection = name;
    return result;
}

export const fetchSchema: (schema: string) => Promise<IResponse<ISchemaResponse>> = async schema => {
    const result = await _fetchAndPublishStatus<ISchemaResponse>(`api/schema/${schema}`);
    if (!result.data) {
        return null;
    }
    _currentSchema = result.data.name;
    result.data.connection = getCurrentConnection();
    return result;
}

export const createScript: () => Promise<IResponse<IScript>> = async () => {
    const result = await _fetch<IScript>(`api/create-script/${getCurrentSchema()}`);
    if (!result.data) {
        return null;
    }
    result.data.connection = getCurrentConnection();
    result.data.schema = getCurrentSchema();
    return result;
}

export const fetchScriptContent: (id: number) => Promise<IResponse<IScriptContent>> = id => _fetch(`api/script-content/${id}`);