define(["require", "exports", "app/api", "app/ui/item-tooltip"], function (require, exports, api_1, item_tooltip_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createTabElement = (id, key, data) => {
        let iconClass;
        let title = data.name;
        let tip;
        if (key === api_1.Keys.SCRIPTS) {
            iconClass = "icon-doc-text";
            tip = item_tooltip_1.scriptTitle(data);
        }
        else if (key === api_1.Keys.TABLES) {
            iconClass = "icon-database";
            tip = item_tooltip_1.tableTitle(data);
        }
        else if (key === api_1.Keys.VIEWS) {
            iconClass = "icon-database";
            tip = item_tooltip_1.viewTitle(data);
        }
        else if (key === api_1.Keys.ROUTINES) {
            iconClass = "icon-database";
            tip = item_tooltip_1.routineTitle(data);
        }
        return String.html `
    <div class="tab">
        <i class=${iconClass}></i>
        <span class="title">${title}</span>
        <i class="close" title="close">&#10006</i>
    </div>`
            .toElement()
            .attr("id", id)
            .attr("title", tip);
    };
});
//# sourceMappingURL=tabs.js.map