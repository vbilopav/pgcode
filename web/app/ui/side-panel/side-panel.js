define(["require", "exports", "app/_sys/pubsub"], function (require, exports, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            element.addClass("side-panel").html(String.html `
            <div class="panel-docs" style="display: none;">docs</div>
            <div class="panel-tables" style="display: none;">tables</div>
            <div class="panel-views" style="display: none;">views</div>
            <div class="panel-funcs" style="display: none;">funcs</div>
            <div class="panel-search" style="display: none;">search</div>
        `);
            pubsub_1.subscribe([
                pubsub_1.STATE_CHANGED_DOCS, pubsub_1.STATE_CHANGED_TABLES, pubsub_1.STATE_CHANGED_VIEWS, pubsub_1.STATE_CHANGED_FUNCS, pubsub_1.STATE_CHANGED_SEARCH
            ], (key, state) => {
                element.find(`.panel-${key}`).showElement(state);
            });
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=side-panel.js.map