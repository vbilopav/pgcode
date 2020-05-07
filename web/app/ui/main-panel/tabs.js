define(["require", "exports", "app/api", "app/ui/item-tooltip"], function (require, exports, api_1, item_tooltip_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const rgbFromStr = (s) => {
        const i = s.hashCode();
        var c = (i & 0x00FFFFFF).toString(16).toUpperCase();
        return "#" + "00000".substring(0, 6 - c.length) + c;
    };
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
        return `
        <div class="tab" draggable="true">
            <i class=${iconClass}></i>
            <span class="title">${title}</span>
            <i class="close" title="close">&#10006</i>
            <div class="stripe" style="background-color: ${rgbFromStr(data.connection)}"></div>
        </div>`
            .toElement()
            .attr("id", id)
            .attr("title", tip);
    };
    exports.updateScriptTabElement = (items, data) => {
        const item = items.get(api_1.ScriptId(data));
        if (!item) {
            return;
        }
        item.tab.attr("title", item_tooltip_1.scriptTitle(data));
    };
});
//# sourceMappingURL=tabs.js.map