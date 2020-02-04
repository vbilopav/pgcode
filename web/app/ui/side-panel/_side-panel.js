define(["require", "exports", "app/_sys/pubsub", "app/ui/side-panel/scripts", "app/ui/side-panel/tables", "app/ui/side-panel/views", "app/ui/side-panel/funcs", "app/ui/side-panel/search"], function (require, exports, pubsub_1, scripts_1, tables_1, views_1, funcs_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            element.addClass("side-panel").html(String.html `
            <div style="display: none;">scripts</div>
            <div style="display: none;">tables</div>
            <div style="display: none;">views</div>
            <div style="display: none;">funcs</div>
            <div style="display: none;">search</div>
        `);
            const panels = {
                "scripts": new scripts_1.default(element.children[0]),
                "tables": new tables_1.default(element.children[1]),
                "views": new views_1.default(element.children[3]),
                "funcs": new funcs_1.default(element.children[4]),
                "search": new search_1.default(element.children[5])
            };
            pubsub_1.subscribe([
                pubsub_1.STATE_CHANGED_SCRIPTS, pubsub_1.STATE_CHANGED_TABLES, pubsub_1.STATE_CHANGED_VIEWS, pubsub_1.STATE_CHANGED_FUNCS, pubsub_1.STATE_CHANGED_SEARCH
            ], (key, state) => {
                panels[key].show(state);
            });
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=_side-panel.js.map