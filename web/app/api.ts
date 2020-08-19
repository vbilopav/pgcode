import {API_INITIAL, publish, SET_APP_STATUS, CONNECTION_SET} from "app/_sys/pubsub";
import * as signalR from "libs/signalr/signalr.min.js";
import { GrpcService, GrpcType, GrpcErrorCode, GrpcStatus } from "app/_sys/grpc-service";
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
    user: string,
    version: string
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

const _connectionsHub = new signalR
    .HubConnectionBuilder()
    .withUrl("/connectionsHub")
    .withAutomaticReconnect({nextRetryDelayInMilliseconds: () => 250})
    .build();

const grpc = new GrpcService();

const _runConnectionsHubAndPublishStatus:<T> (factory: (hub: any) => Promise<T>) => Promise<IResponse<T>> = async factory => {
    if (_connectionsHub.state != signalR.HubConnectionState.Connected) {
        await _connectionsHub.start();
    }
    publish(SET_APP_STATUS, AppStatus.BUSY);
    try {
        return {ok: true, status: 200, data: await factory(_connectionsHub)} 
    } catch (error) {
        publish(SET_APP_STATUS, AppStatus.ERROR, error.message);
        console.error(error);
        return {ok: false, status: 500, data: null}
    }
};

const _runConnectionsHub:<T> (factory: (hub: any) => Promise<T>) => Promise<IResponse<T>> = async factory => {
    if (_connectionsHub.state != signalR.HubConnectionState.Connected) {
        await _connectionsHub.start();
    }
    try {
        return {ok: true, status: 200, data: await factory(_connectionsHub)} 
    } catch (error) {
        console.error(error);
        return {ok: false, status: 500, data: null}
    }
};

let _currentSchema: string;
let _currentConnection: string;

export const getCurrentSchema = () => _currentSchema;
export const getCurrentConnection = () => _currentConnection;

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

const fetchInitial: () => Promise<IResponse<IInitialResponse>> = () =>
    _runConnectionsHubAndPublishStatus<IInitialResponse>(hub => hub.invoke("GetInitial"));

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
    const result = await _runConnectionsHubAndPublishStatus<IConnectionResponse>(async hub => 
        JSON.parse(await hub.invoke("GetConnection", name, Intl.DateTimeFormat().resolvedOptions().timeZone)));
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
    let connection = getCurrentConnection();
    const result = await _runConnectionsHubAndPublishStatus<ISchemaResponse>(async hub => 
        JSON.parse(await hub.invoke("GetSchema", connection, schema)));
    if (!result.data) {
        return null;
    }
    _currentSchema = result.data.name;
    result.data.connection = getCurrentConnection();
    return result;
};

export const createScript: () => Promise<IResponse<IScript>> = async () => {
    let connection = getCurrentConnection();
    let schema = getCurrentSchema();
    const result = await _runConnectionsHub<IScript>(async hub => 
        JSON.parse(await hub.invoke("CreateScript", connection, schema)));
    if (!result.data) {
        return null;
    }
    result.data.connection = connection;
    result.data.schema = schema;
    return result;
};

export const fetchScriptContent = (connection: string, id: number) => {
    return _runConnectionsHub<IScriptContent>(async hub => JSON.parse(await hub.invoke("GetScriptContent", connection, Number(id))));
}

export const saveScriptContent = (connection: string, id: number, content: string, viewState: string) => {
    return _runConnectionsHub<string>(async hub => JSON.parse(await hub.invoke("SaveScriptContent", connection, Number(id), content, viewState)));
}

export const saveScriptScrollPosition = (connection: string, id: number, scrollTop?: number, scrollLeft?: number) => {
    return _runConnectionsHub<string>(async hub => JSON.parse(await hub.invoke("SaveScriptScrollPosition", connection, JSON.stringify({id: Number(id), scrollTop, scrollLeft}))));
}

export const checkItemExists = (connection: string, schema: string, key: string, id: string) => {
    return _runConnectionsHub<boolean>(hub => hub.invoke("CheckItemExists", connection, schema, key, id));
}



const _createExecuteHub = () => new signalR
    .HubConnectionBuilder()
    .withUrl("/executeHub")
    .withAutomaticReconnect({nextRetryDelayInMilliseconds: () => 250})
    .build();

const _executeHubs: Record<string, any> = {};

const _getExecuteHub = async (id: string, start = false) => {
    let hub = _executeHubs[id];
    if (!hub) {
        hub = _createExecuteHub();
        _executeHubs[id] = hub;
    }
    if (start) {
        if (hub.state != signalR.HubConnectionState.Connected) {
            await hub.start();
        }
    }
    return hub;
}

export const initConnection = async (connection: string, schema: string, id: string) => {
    const hub = await _getExecuteHub(id, true);
    try {
        return {ok: true, status: 200, data: hub.invoke("InitConnection", connection, schema, id)} 
    } catch (error) {
        console.error(error);
        return {ok: false, status: 500, data: null}
    }
}

export const disposeConnection = async (id: string) => {
    const hub = await _getExecuteHub(id, true);
    try {
        const result = {ok: true, status: 200, data: hub.invoke("DisposeConnection")};
        await hub.stop();
        delete _executeHubs[id];
        return result;
    } catch (error) {
        console.error(error);
        return {ok: false, status: 500, data: null}
    }
}

interface IRow {
    rn: number;
    data: Array<string>;
    nullIndexes: Array<number>;
};

export interface IHeader {
    name: string;
    type: string;
};

export interface INotice {
    constraintName: string;
    dataTypeName: string;
    columnName: string;
    tableName: string;
    schemaName: string;
    where: string;
    internalQuery: string;
    position: number;
    line: string;
    hint: string;
    detail: string;
    messageText: string;
    sqlState: string;
    severity: string;
    internalPosition: number;
    routine: string;
    time: string;
}

export interface IStats {
    read: string;
    execution: string;
    total: string;
    rows: number;
    message: string;
}

export interface IExecutionStream {
    reconnect: () => void;
    stats: (e: IStats) => void;
    error: (e: GrpcStatus) => void;
    status: (e: GrpcStatus) => void;
    message: (e: INotice) => void;
    header: (e: Array<IHeader>) => void;
    row: (rn: number, e: Array<string>) => void;
    end: () => void;
}

export const execute = async (connection: string, schema: string, id: string, content: string, stream: IExecutionStream) => {
    const hub = await _getExecuteHub(id, false);
    const callStreamMethod = (method: string, ...args: any[]) => {
        if (stream[method]) {
            stream[method](...args);
        }
    };

    if (hub.state != signalR.HubConnectionState.Connected || hub.connectionId == undefined) {
        callStreamMethod("reconnect");
        return;
    }
    const messageName = `message-${id}`;
    const statsName = `stats-${id}`;

    const grpcStream = grpc.serverStreaming({
        service: "/api.ExecuteService/Execute",
        request: [GrpcType.String, GrpcType.String, GrpcType.String, GrpcType.String],
        reply: [{rn: GrpcType.Uint32}, {data: [GrpcType.String]}, {nullIndexes: GrpcType.PackedUint32}]
    }, connection, schema, id, content, hub.connection.connectionId);

    hub.off(messageName);
    hub.off(statsName);

    hub.on(messageName, (msg: INotice) => callStreamMethod("message", msg));
    hub.on(statsName, (msg: IStats) => callStreamMethod("stats", msg));

    let header = false;
    grpcStream
        .on("error", e => {
            if ((e as GrpcStatus).code == GrpcErrorCode.NotFound && (e as GrpcStatus).message == "connection not initialized" && stream["reconnect"]) {
                stream.reconnect();
            } else {
                callStreamMethod("error", e);
                publish(SET_APP_STATUS, AppStatus.ERROR, (e as GrpcStatus).message);
            }
        })
        .on("status", e => callStreamMethod("status", e))
        .on("data", e => {
            if (!header) {
                if (stream["header"]) {
                    const headerResult = new Array<IHeader>();
                    for(let item of (e as IRow).data){
                        headerResult.push(JSON.parse(item));
                    };
                    stream.header(headerResult);
                }
                header = true;
                return;
            }
            if (stream["row"]) {
                let row = e as IRow;
                if (row.nullIndexes && row.nullIndexes.length) {
                    for(let idx of row.nullIndexes){
                        row.data[idx] = null;
                    };
                }
                stream.row(row.rn, row.data);
            }
        })
        .on("end", () => callStreamMethod("end"));
}