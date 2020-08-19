define(["require", "exports", "app/_sys/pubsub", "libs/signalr/signalr.min.js", "app/_sys/grpc-service", "vs/editor/editor.main"], function (require, exports, pubsub_1, signalR, grpc_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScriptId = item => `${Keys.SCRIPTS}-${item.connection}-${item.schema}-${item.id}`;
    exports.TableId = item => `${Keys.TABLES}-${item.connection}-${item.schema}-${item.id}`;
    exports.ViewId = item => `${Keys.VIEWS}-${item.connection}-${item.schema}-${item.id}`;
    exports.RoutineId = item => `${Keys.ROUTINES}-${item.connection}-${item.schema}-${item.id}`;
    exports.classes = { active: "active", sticky: "sticky", docked: "docked" };
    var Position;
    (function (Position) {
        Position["LEFT"] = "left";
        Position["RIGHT"] = "right";
    })(Position = exports.Position || (exports.Position = {}));
    var Themes;
    (function (Themes) {
        Themes["DARK"] = "dark";
        Themes["LIGHT"] = "light";
    })(Themes = exports.Themes || (exports.Themes = {}));
    var AppStatus;
    (function (AppStatus) {
        AppStatus[AppStatus["READY"] = 0] = "READY";
        AppStatus[AppStatus["BUSY"] = 1] = "BUSY";
        AppStatus[AppStatus["ERROR"] = 2] = "ERROR";
        AppStatus[AppStatus["NO_CONNECTION"] = 3] = "NO_CONNECTION";
    })(AppStatus = exports.AppStatus || (exports.AppStatus = {}));
    var Keys;
    (function (Keys) {
        Keys["SCRIPTS"] = "scripts";
        Keys["TABLES"] = "tables";
        Keys["VIEWS"] = "views";
        Keys["ROUTINES"] = "routines";
        Keys["SEARCH"] = "search";
    })(Keys = exports.Keys || (exports.Keys = {}));
    var Languages;
    (function (Languages) {
        Languages["PGSQL"] = "pgsql";
    })(Languages = exports.Languages || (exports.Languages = {}));
    const _connectionsHub = new signalR
        .HubConnectionBuilder()
        .withUrl("/connectionsHub")
        .withAutomaticReconnect({ nextRetryDelayInMilliseconds: () => 250 })
        .build();
    const grpc = new grpc_service_1.GrpcService();
    const _runConnectionsHubAndPublishStatus = async (factory) => {
        if (_connectionsHub.state != signalR.HubConnectionState.Connected) {
            await _connectionsHub.start();
        }
        pubsub_1.publish(pubsub_1.SET_APP_STATUS, AppStatus.BUSY);
        try {
            return { ok: true, status: 200, data: await factory(_connectionsHub) };
        }
        catch (error) {
            pubsub_1.publish(pubsub_1.SET_APP_STATUS, AppStatus.ERROR, error.message);
            console.error(error);
            return { ok: false, status: 500, data: null };
        }
    };
    const _runConnectionsHub = async (factory) => {
        if (_connectionsHub.state != signalR.HubConnectionState.Connected) {
            await _connectionsHub.start();
        }
        try {
            return { ok: true, status: 200, data: await factory(_connectionsHub) };
        }
        catch (error) {
            console.error(error);
            return { ok: false, status: 500, data: null };
        }
    };
    let _currentSchema;
    let _currentConnection;
    exports.getCurrentSchema = () => _currentSchema;
    exports.getCurrentConnection = () => _currentConnection;
    let _initialResponse;
    let _connectionNames = new Array();
    let _colors = new Array();
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
    exports.getConnectionColor = (name) => {
        const index = _connectionNames.indexOf(name);
        if (index != -1) {
            return _colors[index];
        }
        const i = name.hashCode();
        const c = (i & 0x00FFFFFF).toString(16).toUpperCase();
        return "#" + "00000".substring(0, 6 - c.length) + c;
    };
    const fetchInitial = () => _runConnectionsHubAndPublishStatus(hub => hub.invoke("GetInitial"));
    exports.initializeApi = async () => {
        _initialResponse = await fetchInitial();
        if (_initialResponse.ok) {
            _connectionNames = _initialResponse.data.connections.map(c => c.name);
        }
        pubsub_1.publish(pubsub_1.API_INITIAL, _initialResponse);
    };
    exports.connectionIsDefined = connection => {
        if (!_initialResponse || !_initialResponse.ok || !_initialResponse.data || !_initialResponse.data.connections || !_initialResponse.data.connections.length) {
            return false;
        }
        return _initialResponse.data.connections.find(c => c.name == connection) ? true : false;
    };
    exports.fetchConnection = async (name) => {
        const result = await _runConnectionsHubAndPublishStatus(async (hub) => JSON.parse(await hub.invoke("GetConnection", name, Intl.DateTimeFormat().resolvedOptions().timeZone)));
        if (!result.data) {
            return result;
        }
        _currentSchema = result.data.schemas.selected;
        _currentConnection = name;
        result.data.connection = name;
        pubsub_1.publish(pubsub_1.CONNECTION_SET, _currentConnection);
        return result;
    };
    exports.fetchSchema = async (schema) => {
        let connection = exports.getCurrentConnection();
        const result = await _runConnectionsHubAndPublishStatus(async (hub) => JSON.parse(await hub.invoke("GetSchema", connection, schema)));
        if (!result.data) {
            return null;
        }
        _currentSchema = result.data.name;
        result.data.connection = exports.getCurrentConnection();
        return result;
    };
    exports.createScript = async () => {
        let connection = exports.getCurrentConnection();
        let schema = exports.getCurrentSchema();
        const result = await _runConnectionsHub(async (hub) => JSON.parse(await hub.invoke("CreateScript", connection, schema)));
        if (!result.data) {
            return null;
        }
        result.data.connection = connection;
        result.data.schema = schema;
        return result;
    };
    exports.fetchScriptContent = (connection, id) => {
        return _runConnectionsHub(async (hub) => JSON.parse(await hub.invoke("GetScriptContent", connection, Number(id))));
    };
    exports.saveScriptContent = (connection, id, content, viewState) => {
        return _runConnectionsHub(async (hub) => JSON.parse(await hub.invoke("SaveScriptContent", connection, Number(id), content, viewState)));
    };
    exports.saveScriptScrollPosition = (connection, id, scrollTop, scrollLeft) => {
        return _runConnectionsHub(async (hub) => JSON.parse(await hub.invoke("SaveScriptScrollPosition", connection, JSON.stringify({ id: Number(id), scrollTop, scrollLeft }))));
    };
    exports.checkItemExists = (connection, schema, key, id) => {
        return _runConnectionsHub(hub => hub.invoke("CheckItemExists", connection, schema, key, id));
    };
    const _createExecuteHub = () => new signalR
        .HubConnectionBuilder()
        .withUrl("/executeHub")
        .withAutomaticReconnect({ nextRetryDelayInMilliseconds: () => 250 })
        .build();
    const _executeHubs = {};
    const _getExecuteHub = async (id, start = false) => {
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
    };
    exports.initConnection = async (connection, schema, id) => {
        const hub = await _getExecuteHub(id, true);
        try {
            return { ok: true, status: 200, data: hub.invoke("InitConnection", connection, schema, id) };
        }
        catch (error) {
            console.error(error);
            return { ok: false, status: 500, data: null };
        }
    };
    exports.disposeConnection = async (id) => {
        const hub = await _getExecuteHub(id, true);
        try {
            const result = { ok: true, status: 200, data: hub.invoke("DisposeConnection") };
            await hub.stop();
            delete _executeHubs[id];
            return result;
        }
        catch (error) {
            console.error(error);
            return { ok: false, status: 500, data: null };
        }
    };
    ;
    ;
    exports.execute = async (connection, schema, id, content, stream) => {
        const hub = await _getExecuteHub(id, false);
        const callStreamMethod = (method, ...args) => {
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
            request: [grpc_service_1.GrpcType.String, grpc_service_1.GrpcType.String, grpc_service_1.GrpcType.String, grpc_service_1.GrpcType.String],
            reply: [{ rn: grpc_service_1.GrpcType.Uint32 }, { data: [grpc_service_1.GrpcType.String] }, { nullIndexes: grpc_service_1.GrpcType.PackedUint32 }]
        }, connection, schema, id, content, hub.connection.connectionId);
        hub.off(messageName);
        hub.off(statsName);
        hub.on(messageName, (msg) => callStreamMethod("message", msg));
        hub.on(statsName, (msg) => callStreamMethod("stats", msg));
        let header = false;
        grpcStream
            .on("error", e => {
            if (e.code == grpc_service_1.GrpcErrorCode.NotFound && e.message == "connection not initialized" && stream["reconnect"]) {
                stream.reconnect();
            }
            else {
                callStreamMethod("error", e);
                pubsub_1.publish(pubsub_1.SET_APP_STATUS, AppStatus.ERROR, e.message);
            }
        })
            .on("status", e => callStreamMethod("status", e))
            .on("data", e => {
            if (!header) {
                if (stream["header"]) {
                    const headerResult = new Array();
                    for (let item of e.data) {
                        headerResult.push(JSON.parse(item));
                    }
                    ;
                    stream.header(headerResult);
                }
                header = true;
                return;
            }
            if (stream["row"]) {
                let row = e;
                if (row.nullIndexes && row.nullIndexes.length) {
                    for (let idx of row.nullIndexes) {
                        row.data[idx] = null;
                    }
                    ;
                }
                stream.row(row.rn, row.data);
            }
        })
            .on("end", () => callStreamMethod("end"));
    };
});
//# sourceMappingURL=api.js.map