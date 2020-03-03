define(["require", "exports", "app/types", "app/api", "app/ui/side-panel/panel"], function (require, exports, types_1, api_1, panel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 extends panel_1.default {
        constructor(element) {
            super(element, types_1.Keys.TABLES, [
                { text: "Filter" },
                { text: "Order ascending" },
                { text: "Order descending" },
            ]);
        }
        schemaChanged(data) {
            this.items.html("");
            for (let item of data.tables) {
                this.addNewItem(item);
            }
            this.publishLength();
        }
        addNewItem(item) {
            let title = `${item.name}\nestimated row count: ${item.estimate}`;
            if (item.comment) {
                title = title + `\n\n${item.comment.substring(0, 200)}`;
            }
            this.createItemElement(String.html `
            <div>
                <i class="icon-database"></i>
                <span>${item.name}</span>
            </div>
            <div>
                <div class="item-subtext">count=${item.estimate}</div>
            </div>
        `)
                .dataAttr("item", item)
                .attr("title", title)
                .attr("id", api_1.TableId(item.id))
                .appendElementTo(this.items);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=tables.js.map