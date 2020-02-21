define(["require", "exports", "app/_sys/pubsub", "app/types", "app/ui/side-panel/panel"], function (require, exports, pubsub_1, types_1, panel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 extends panel_1.default {
        constructor(element) {
            super(element, types_1.keys.scripts.toUpperCase(), [
                { text: "New script", keyBindingsInfo: "Ctrl+N" },
                { splitter: true },
                { text: "Order ascending" },
                { text: "Order descending" },
            ]);
            pubsub_1.subscribe(pubsub_1.WS_CHANGED, (data) => {
                pubsub_1.publish(pubsub_1.ITEM_COUNT_CHANGED, types_1.keys.scripts, data.scripts.length);
                this.items.html("");
                for (let item of data.scripts) {
                    String.html `<div data-id="${item.id}">${item.title}</div>`
                        .toElement()
                        .appendElementTo(this.items);
                }
            });
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=scripts.js.map