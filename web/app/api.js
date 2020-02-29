define(["require", "exports", "app/_sys/pubsub", "app/types"], function (require, exports, pubsub_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScriptId = id => `${types_1.Keys.SCRIPTS}${id}`;
    const _createResponse = (response, data) => Object({ ok: response.ok, status: response.status, data: data });
    const _fetchAndPublishStatus = async (url, init) => {
        pubsub_1.publish(pubsub_1.SET_APP_STATUS, types_1.AppStatus.BUSY);
        try {
            const response = await fetch(url, init);
            if (!response.ok) {
                pubsub_1.publish(pubsub_1.SET_APP_STATUS, types_1.AppStatus.ERROR, response.status);
                return _createResponse(response);
            }
            return _createResponse(response, await response.json());
        }
        catch (error) {
            pubsub_1.publish(pubsub_1.SET_APP_STATUS, types_1.AppStatus.ERROR, error.message);
            throw error;
        }
    };
    const _fetch = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            return _createResponse(response);
        }
        return _createResponse(response, await response.json());
    };
    let _currentSchema;
    const getCurrentSchema = () => _currentSchema;
    const getTimezoneHeader = () => {
        return { headers: { "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone } };
    };
    exports.fetchInitial = async () => _fetchAndPublishStatus("api/initial");
    exports.fetchConnection = async (name) => {
        const result = _fetchAndPublishStatus(`api/connection/${name}`, getTimezoneHeader());
        _currentSchema = (await result).data.schemas.selected;
        return result;
    };
    exports.fetchSchema = async (schema) => {
        const result = _fetchAndPublishStatus(`api/schema/${schema}`);
        _currentSchema = (await result).data.name;
        return result;
    };
    exports.createScript = async () => _fetch(`api/create-script/${getCurrentSchema()}`);
    exports.fetchScriptContent = async (id) => _fetch(`api/script-content/${id}`);
});
//# sourceMappingURL=api.js.map