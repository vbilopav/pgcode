define(["require", "exports", "app/api", "app/ui/side-panel/panel", "app/ui/item-tooltip"], function (require, exports, api_1, panel_1, item_tooltip_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TablePanel extends panel_1.default {
        constructor(element, keyName) {
            super(element, keyName, [
                { text: "Filter" },
                { text: "Order ascending" },
                { text: "Order descending" },
            ]);
        }
        schemaChanged(data, schema) {
            this.items.html("");
            for (let item of data[this.key]) {
                this.addNewItem({ schema: schema, connection: data.connection, ...item });
            }
            this.publishLength();
        }
        addNewItem(item) {
            const comment = item.comment ? String.html `<div class="item-comment">${item.comment.replace("\n", "")}</div>` : "";
            this.createItemElement(String.html `
            <div>
                <i class="icon-database"></i>
                <span>${item.name}</span>
            </div>
            <div>
                <div class="item-subtext">count ≈ ${item.estimate}</div>
                ${comment}
            </div>
        `)
                .dataAttr("item", item)
                .attr("title", item_tooltip_1.tableTitle(item))
                .attr("id", api_1.TableId(item.id))
                .appendElementTo(this.items);
        }
        itemSelected(element) {
            const item = element.dataAttr("item");
            this.mainPanel.activate(api_1.TableId(item.id), this.key, item);
        }
        ;
    }
    class Tables extends TablePanel {
        constructor(element) {
            super(element, api_1.Keys.TABLES);
        }
    }
    exports.Tables = Tables;
    class Views extends TablePanel {
        constructor(element) {
            super(element, api_1.Keys.VIEWS);
        }
    }
    exports.Views = Views;
});
//# sourceMappingURL=tables.js.map