define(["require", "exports", "app/_sys/pubsub", "app/controls/splitter"], function (require, exports, pubsub_1, splitter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element, splitter, container) {
            element.addClass("side-panel").html(String.html `
            <div class="panel-docs" style="display: none;">docs</div>
            <div class="panel-tables" style="display: none;">tables</div>
            <div class="panel-views" style="display: none;">views</div>
            <div class="panel-funcs" style="display: none;">funcs</div>
            <div class="panel-search" style="display: none;">search</div>
        `);
            this.splitter = new splitter_1.VerticalSplitter({
                name: "v-splitter",
                element: container.children[2],
                container: container,
                resizeIdx: 1,
                autoIdx: 3,
                maxResizeDelta: 100,
                events: {
                    docked: () => pubsub_1.publish(pubsub_1.SIDEBAR_DOCKED),
                    undocked: () => pubsub_1.publish(pubsub_1.SIDEBAR_UNDOCKED),
                    changed: () => { },
                }
            });
            this.splitter.start();
            pubsub_1.subscribe([
                pubsub_1.STATE_CHANGED_DOCS, pubsub_1.STATE_CHANGED_TABLES, pubsub_1.STATE_CHANGED_VIEWS, pubsub_1.STATE_CHANGED_FUNCS, pubsub_1.STATE_CHANGED_SEARCH
            ], (key, state) => {
                element.find(`.panel-${key}`).showElement(state);
            });
            pubsub_1.subscribe(pubsub_1.STATE_CHANGED_ON, () => {
                if (this.splitter.isDocked) {
                    this.splitter.undock();
                }
            });
            pubsub_1.subscribe(pubsub_1.STATE_CHANGED_OFF, () => {
                if (!this.splitter.isDocked) {
                    this.splitter.dock();
                }
            });
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=side-panel.js.map