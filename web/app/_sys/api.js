define(["require", "exports", "app/_sys/pubsub", "app/types"], function (require, exports, pubsub_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _createResponse = (response, data) => Object({ ok: response.ok, status: response.status, data: data });
    const fetchConnections = async () => {
        pubsub_1.publish(pubsub_1.SET_APP_STATUS, types_1.AppStatus.BUSY);
        try {
            const response = await fetch("connections");
            if (!response.ok) {
                pubsub_1.publish(pubsub_1.SET_APP_STATUS, types_1.AppStatus.ERROR, response.status);
                return _createResponse(response);
            }
            pubsub_1.publish(pubsub_1.SET_APP_STATUS, types_1.AppStatus.READY);
            return _createResponse(response, await response.json());
        }
        catch (error) {
            pubsub_1.publish(pubsub_1.SET_APP_STATUS, types_1.AppStatus.ERROR);
            throw error;
        }
    };
    exports.fetchConnections = fetchConnections;
});
//# sourceMappingURL=api.js.map