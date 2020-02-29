import { publish, SET_APP_STATUS } from "app/_sys/pubsub";
import { AppStatus, Keys } from "app/types";

export const ScriptId: (id: number) => string = id  => `${Keys.SCRIPTS}${id}`;

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

export interface IRoutineInfo {
    id: string,
    language: string,
    name: string,
    type: string
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