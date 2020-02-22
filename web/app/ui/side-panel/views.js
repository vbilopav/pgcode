define(["require", "exports", "app/types", "app/ui/side-panel/panel"], function (require, exports, types_1, panel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 extends panel_1.default {
        constructor(element) {
            super(element, types_1.keys.views, [
                { text: "Filter" },
                { text: "Order ascending" },
                { text: "Order descending" },
            ]);
        }
        schemaChanged(data) {
            this.items.html("");
            for (let item of data.views) {
                String.html `
            <div>
                <i class="icon-database"></i>
                <span>${item}</span>
            </div>
            `.toElement().appendElementTo(this.items);
            }
            this.publishLength();
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=views.js.map