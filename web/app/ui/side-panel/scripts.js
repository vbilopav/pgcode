define(["require", "exports", "app/api", "app/ui/side-panel/panel"], function (require, exports, api_1, panel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 extends panel_1.default {
        constructor(element) {
            super(element, api_1.Keys.SCRIPTS, [
                { text: "New script", keyBindingsInfo: "Ctrl+N", action: () => this.createScript() },
                { splitter: true },
                { text: "Filter" },
                { text: "Order ascending" },
                { text: "Order descending" },
            ]);
        }
        schemaChanged(data, schema) {
            this.items.html("");
            for (let item of data.scripts) {
                this.addNewItem({ schema: schema, connection: data.connection, ...item });
            }
            this.publishLength();
        }
        async createScript() {
            const response = await api_1.createScript();
            if (response.ok) {
                this.addNewItem(response.data);
                this.publishLength();
            }
        }
        addNewItem(item) {
            let title = `${item.name}\nmodified: ${item.timestamp}`;
            if (item.comment) {
                title = title + `\n\n${item.comment.substring(0, 200)}`;
            }
            this.createItemElement(String.html `
            <div>
                <i class="icon-doc-text"></i>
                <span>${item.name}</span>
            </div>
            <div>
                <div class="item-subtext">${item.timestamp.formatDateString()}</div>
            </div>
        `)
                .dataAttr("item", item)
                .attr("title", title)
                .attr("id", api_1.ScriptId(item.id))
                .appendElementTo(this.items);
        }
        itemSelected(element) {
            const item = element.dataAttr("item");
            this.mainPanel.activate(api_1.ScriptId(item.id), api_1.Keys.SCRIPTS, item);
        }
        ;
    }
    exports.default = default_1;
});
//# sourceMappingURL=scripts.js.map