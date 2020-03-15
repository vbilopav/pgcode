define(["require", "exports", "app/api", "app/ui/side-panel/panel", "app/ui/item-tooltip"], function (require, exports, api_1, panel_1, item_tooltip_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 extends panel_1.default {
        constructor(element) {
            super(element, api_1.Keys.ROUTINES, [
                { text: "Filter" },
                { text: "Order ascending" },
                { text: "Order descending" },
            ]);
        }
        schemaChanged(data, schema) {
            this.items.html("");
            for (let item of data.routines) {
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
                <div class="item-subtext">${item.language} ${item.type} returns ${item.returns}</div>
                ${comment}
            </div>
        `)
                .dataAttr("item", item)
                .attr("title", item_tooltip_1.routineTitle(item))
                .attr("id", api_1.RoutineId(item.id))
                .appendElementTo(this.items);
        }
        itemSelected(element) {
            const item = element.dataAttr("item");
            this.mainPanel.activate(api_1.RoutineId(item.id), api_1.Keys.ROUTINES, item);
        }
        ;
    }
    exports.default = default_1;
});
//# sourceMappingURL=routines.js.map