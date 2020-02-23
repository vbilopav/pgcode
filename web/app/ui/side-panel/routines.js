define(["require", "exports", "app/types", "app/ui/side-panel/panel"], function (require, exports, types_1, panel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 extends panel_1.default {
        constructor(element) {
            super(element, types_1.keys.routines, [
                { text: "Filter" },
                { text: "Order ascending" },
                { text: "Order descending" },
            ]);
        }
        schemaChanged(data) {
            this.items.html("");
            for (let item of data.routines) {
                this.addNewItem(item);
            }
            this.publishLength();
        }
        addNewItem(item) {
            this.createItemElement(String.html `
            <i class="icon-database"></i>
            <span>${item.name}</span>
        `)
                .dataAttr("item", item)
                .appendElementTo(this.items);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=routines.js.map