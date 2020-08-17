define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            this.element = element;
            this.table = null;
        }
        initGrid() {
            this.element.html("");
            this.table = document.createElement("div").appendElementTo(this.element).addClass("table");
        }
        addHeader(header) {
            const th = document.createElement("div").appendElementTo(this.table).addClass("th");
            document.createElement("div").appendElementTo(th).addClass("td");
            for (let item of header) {
                document.createElement("div").html(`<div>${item.name}</div><div>${item.type}</div>`).appendElementTo(th).addClass("td");
            }
        }
        addRow(rn, row) {
            const tr = document.createElement("div").appendElementTo(this.table).addClass("tr");
            document.createElement("div").html(`${rn}`).appendElementTo(tr).addClass("td").addClass("th");
            ;
            for (let item of row) {
                document.createElement("div").html(`${(item == null ? "NULL" : item)}`).appendElementTo(tr).addClass("td");
            }
            this.adjustGridHeight();
        }
        adjustGridHeight() {
            if (!this.table) {
                return;
            }
            this.table.css("height", this.element.parentElement.getBoundingClientRect().height + "px");
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=results.js.map