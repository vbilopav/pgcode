define(["require", "exports", "app/_sys/pubsub", "app/ui/side-panel/scripts", "app/ui/side-panel/tables", "app/ui/side-panel/views", "app/ui/side-panel/routines", "app/ui/side-panel/search", "app/types"], function (require, exports, pubsub_1, scripts_1, tables_1, views_1, routines_1, search_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element, mainPanel) {
            element.addClass("side-panel").html(String.html `
            <div style="display: none;">
                <div></div>
                <div></div>
            </div>
            <div style="display: none;">
                <div></div>
                <div></div>
            </div>
            <div style="display: none;">
                <div></div>
                <div></div>
            </div>
            <div style="display: none;">
                <div></div>
                <div></div>
            </div>
            <div style="display: none;">
                <div></div>
                <div></div>
            </div>
        `);
            const panels = {};
            panels[types_1.Keys.SCRIPTS] = new scripts_1.default(element.children[0]).setMainPanelRef(mainPanel);
            panels[types_1.Keys.TABLES] = new tables_1.default(element.children[1]).setMainPanelRef(mainPanel);
            ;
            panels[types_1.Keys.VIEWS] = new views_1.default(element.children[2]).setMainPanelRef(mainPanel);
            ;
            panels[types_1.Keys.ROUTINES] = new routines_1.default(element.children[3]).setMainPanelRef(mainPanel);
            ;
            panels[types_1.Keys.SEARCH] = new search_1.default(element.children[4]).setMainPanelRef(mainPanel);
            ;
            pubsub_1.subscribe([
                pubsub_1.STATE_CHANGED_SCRIPTS,
                pubsub_1.STATE_CHANGED_TABLES,
                pubsub_1.STATE_CHANGED_VIEWS,
                pubsub_1.STATE_CHANGED_ROUTINES,
                pubsub_1.STATE_CHANGED_SEARCH
            ], (key, state) => {
                panels[key].show(state);
            });
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=_side-panels.js.map