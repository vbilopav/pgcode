define(["require", "exports", "app/_sys/pubsub", "app/types"], function (require, exports, pubsub_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            this.element = element;
            pubsub_1.subscribe(pubsub_1.WS_CHANGED, (data) => {
                pubsub_1.publish(pubsub_1.ITEM_COUNT_CHANGED, types_1.keys.tables, data.tables.length);
            });
        }
        show(state) {
            this.element.showElement(state);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=tables.js.map