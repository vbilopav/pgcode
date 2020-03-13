define(["require", "exports", "app/api"], function (require, exports, api_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createTabElement = (id, key, data) => {
        let iconClass;
        let title;
        if (key === api_1.Keys.SCRIPTS) {
            iconClass = "icon-doc-text";
            title = data.title;
        }
        else if (key === api_1.Keys.TABLES) {
            iconClass = "icon-database";
            title = data.name;
        }
        else if (key === api_1.Keys.VIEWS) {
            iconClass = "icon-database";
            title = data.name;
        }
        else if (key === api_1.Keys.ROUTINES) {
            iconClass = "icon-database";
            title = data.signature;
        }
        return String.html `
    <div class="tab">
        <i class=${iconClass}></i>
        <span class="title">${title}</span>
        <i class="close" title="close">&#10006</i>
    </div>`
            .toElement()
            .dataAttr("data", data)
            .attr("id", id)
            .attr("title", `${data.id} - ${title}\n\nSchema: ${data.schema}\nConnection: ${data.connection}\n\n: ${!data.comment ? "" : data.comment}`);
    };
});
//# sourceMappingURL=tabs.js.map