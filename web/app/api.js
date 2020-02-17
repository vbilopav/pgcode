define(["require", "exports", "app/_sys/pubsub", "app/types"], function (require, exports, pubsub_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _createResponse = (response, data) => Object({ ok: response.ok, status: response.status, data: data });
    const _fetchAndPublishStatus = async (url) => {
        pubsub_1.publish(pubsub_1.SET_APP_STATUS, types_1.AppStatus.BUSY);
        try {
            const response = await fetch(url);
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
    exports.fetchInitial = async () => _fetchAndPublishStatus("api/initial");
    exports.fetchWsConnection = async (name) => _fetchAndPublishStatus(`api/ws-connection/${name}`);
    exports.fetchWorkspace = async (schema) => _fetchAndPublishStatus(`api/ws/${schema}`);
});
//# sourceMappingURL=api.js.map