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
    name: string
}

export interface ISchema { 
    routines: Array<IRoutineInfo>,
    scripts: Array<IScriptInfo>,
    tables: Array<ITableInfo>,
    views: Array<ITableInfo>
}

export interface ITableInfo {
    id: number,
    name: string,
    estimate: number,
    comment: string
}

export interface IRoutineInfo {
    id: number,
    type: string
    language: string,
    name: string,
    signature: string,
    returns: string,
    comment: string
}

export interface IScriptInfo {
    id: number,
    title: string,
    schema: string,
    comment: string,
    timestamp: string
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
const getCurrentSchema = () => _currentSchema;
const getTimezoneHeader: () => RequestInit = () => {
    return {headers: {"timezone": Intl.DateTimeFormat().resolvedOptions().timeZone}}
};

export const fetchInitial: () => Promise<IResponse<IInitialResponse>> = async () => 
    _fetchAndPublishStatus<IInitialResponse>("api/initial");

export const fetchConnection: (name: string) => Promise<IResponse<IConnectionResponse>> = async name => {
    const result = _fetchAndPublishStatus<IConnectionResponse>(`api/connection/${name}`, getTimezoneHeader());
    _currentSchema = (await result).data.schemas.selected;
    return result;
}

export const fetchSchema: (schema: string) => Promise<IResponse<ISchemaResponse>> = async schema => {
    const result = _fetchAndPublishStatus<ISchemaResponse>(`api/schema/${schema}`);
    _currentSchema = (await result).data.name;
    return result;
}

export const createScript: () => Promise<IResponse<IScript>> = async () => _fetch(`api/create-script/${getCurrentSchema()}`);

export const fetchScriptContent: (id: number) => Promise<IResponse<IScriptContent>> = async id => _fetch(`api/script-content/${id}`);