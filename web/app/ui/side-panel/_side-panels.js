define(["require", "exports", "app/_sys/pubsub", "app/ui/side-panel/scripts", "app/ui/side-panel/tables", "app/ui/side-panel/routines", "app/ui/side-panel/search", "app/api"], function (require, exports, pubsub_1, scripts_1, tables_1, routines_1, search_1, api_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element, mainPanel) {
            this.panels = new Map();
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
            this.panels.set(api_1.Keys.SCRIPTS, new scripts_1.default(element.children[0]).setMainPanelRef(mainPanel).setSidePanelRef(this));
            this.panels.set(api_1.Keys.TABLES, new tables_1.Tables(element.children[1]).setMainPanelRef(mainPanel).setSidePanelRef(this));
            this.panels.set(api_1.Keys.VIEWS, new tables_1.Views(element.children[2]).setMainPanelRef(mainPanel).setSidePanelRef(this));
            this.panels.set(api_1.Keys.ROUTINES, new routines_1.default(element.children[3]).setMainPanelRef(mainPanel).setSidePanelRef(this));
            this.panels.set(api_1.Keys.SEARCH, new search_1.default(element.children[4]).setMainPanelRef(mainPanel).setSidePanelRef(this));
            pubsub_1.subscribe([
                pubsub_1.STATE_CHANGED_SCRIPTS,
                pubsub_1.STATE_CHANGED_TABLES,
                pubsub_1.STATE_CHANGED_VIEWS,
                pubsub_1.STATE_CHANGED_ROUTINES,
                pubsub_1.STATE_CHANGED_SEARCH
            ], (key, state) => {
                this.panels.get(key).show(state);
            });
            pubsub_1.subscribe(pubsub_1.TAB_SELECTED, (_, key, schema, connection) => {
                if (!key) {
                    return;
                }
                if (schema !== api_1.getCurrentSchema() || connection !== api_1.getCurrentConnection()) {
                    return;
                }
                for (let [current, panel] of this.panels) {
                    if (key == current) {
                        panel.show(true);
                    }
                    else {
                        panel.show(false);
                    }
                }
            });
        }
        unselectAll() {
            for (let panel of this.panels.values()) {
                panel.unselectAll();
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=_side-panels.js.map