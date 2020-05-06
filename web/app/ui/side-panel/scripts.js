define(["require", "exports", "app/api", "app/ui/side-panel/panel", "app/ui/item-tooltip", "app/_sys/pubsub"], function (require, exports, api_1, panel_1, item_tooltip_1, pubsub_1) {
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
            pubsub_1.subscribe(pubsub_1.SCRIPT_UPDATED, (data) => this.items.find(`#${api_1.ScriptId(data)}`).find(".item-subtext").html(data.timestamp.formatDateString()));
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
                this.sidePanel.unselectAll();
                this.selectItemByElement(this.addNewItem(response.data), true, { content: response.data, sticky: false });
                this.publishLength();
            }
        }
        addNewItem(item) {
            const comment = item.comment ? String.html `<div class="item-comment">${item.comment.replace("\n", "")}</div>` : "";
            return this.createItemElement(String.html `
            <div>
                <i class="icon-doc-text"></i>
                <span>${item.name}</span>
            </div>
            <div>
                <div class="item-subtext">${item.timestamp.formatDateString()}</div>
                ${comment}
            </div>
        `)
                .dataAttr("item", item)
                .attr("title", item_tooltip_1.scriptTitle(item))
                .attr("id", api_1.ScriptId(item))
                .appendElementTo(this.items);
        }
        itemSelected(element, contentArgs) {
            const item = element.dataAttr("item");
            this.mainPanel.activate(api_1.ScriptId(item), api_1.Keys.SCRIPTS, item, contentArgs);
        }
        ;
    }
    exports.default = default_1;
});
//# sourceMappingURL=scripts.js.map