define(["require", "exports", "app/_sys/pubsub"], function (require, exports, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            this.element = element;
            pubsub_1.subscribe(pubsub_1.WS_CHANGED, (data) => {
                console.log(data.scripts);
            });
        }
        show(state) {
            this.element.showElement(state);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=scripts.js.map