define(["require", "exports", "app/_sys/pubsub"], function (require, exports, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            element.addClass("side-panel").html(String.html `
            <div>docs</div>
            <div>tables</div>
            <div>views</div>
            <div>funcs</div>
            <div>search</div>
        `);
            pubsub_1.subscribe(pubsub_1.STATE_CHANGED, (key, state) => {
                console.log(key, state);
            });
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=side-panel.js.map