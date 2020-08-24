define(["require", "exports", "app/api", "app/_sys/timeout"], function (require, exports, api_1, timeout_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(id, element) {
            this.rows = new Map();
            this.table = null;
            this.header = null;
            this.last = null;
            this.first = null;
            this.headerHeight = null;
            this.rowHeight = null;
            this.toMove = null;
            this.moving = false;
            this.stats = null;
            this.start = null;
            this.end = null;
            this.connectionId = null;
            this.virtualTop = null;
            this.virtualBottom = null;
            this.id = id;
            this.element = element;
            window
                .on("mousedown", (e) => this.mousedown(e))
                .on("mouseup", (e) => this.mouseup(e))
                .on("mousemove", (e) => this.mousemove(e))
                .on("resize", () => this.adjust());
        }
        init() {
            this.element.html("");
            this.table = document.createElement("div").appendElementTo(this.element).addClass("table").on("scroll", e => this.onTableScroll());
            this.header = null;
            this.last = null;
            this.first = null;
            this.rowHeight = null;
            this.virtualTop = null;
            this.virtualBottom = null;
            this.rows.clear();
        }
        addHeader(header) {
            let i = 0;
            this.header = document.createElement("div").appendElementTo(this.table).addClass("th").dataAttr("row", 0);
            document.createElement("div").appendElementTo(this.header)
                .addClass("td")
                .addClass(`td${++i}`)
                .dataAttr("col", i)
                .on("mouseenter", (e) => this.cellMouseEnter(e.currentTarget))
                .on("mouseleave", (e) => this.cellMouseLeave(e.currentTarget));
            this.virtualTop = document.createElement("div").css("display", "table-row").css("height", "0px").dataAttr("top", true);
            for (let item of header) {
                document
                    .createElement("div")
                    .html(`<div>${item.name}</div><div>${item.type}</div>`)
                    .appendElementTo(this.header)
                    .addClass("td")
                    .addClass(`td${++i}`)
                    .dataAttr("col", i)
                    .on("mousemove", (e) => this.headerCellMousemove(e))
                    .on("mouseenter", (e) => this.cellMouseEnter(e.currentTarget))
                    .on("mouseleave", (e) => this.cellMouseLeave(e.currentTarget));
                document.createElement("div").css("display", "table-cell").appendElementTo(this.virtualTop);
            }
            this.headerHeight = this.header.clientHeight;
            this.virtualTop.appendElementTo(this.table);
        }
        addRow(rn, row) {
            const e = this.newRow(rn, row).appendElementTo(this.table);
            this.rows.set(rn, e);
            if (this.rowHeight == null) {
                this.rowHeight = e.clientHeight;
            }
        }
        done(stats) {
            this.stats = stats;
            this.start = 1;
            this.end = stats.rowsFetched;
            this.virtualBottom = document.createElement("div").appendElementTo(this.table)
                .css("height", ((stats.rowsAffected - stats.rowsFetched) * this.rowHeight) + "px")
                .dataAttr("bottom", true);
        }
        adjust() {
            if (!this.table) {
                return;
            }
            if (!this.table) {
                return;
            }
            const rect = this.element.parentElement.getBoundingClientRect();
            this.table.css("height", rect.height + "px");
            if (this.last == null || this.first == null) {
                return;
            }
            const last = this.last.getBoundingClientRect();
            const first = this.first.getBoundingClientRect();
            if (first.y < rect.y || last.y > (rect.y + rect.height)) {
                this.table.css("overflow-y", "scroll");
            }
            else {
                this.table.css("overflow-y", "hidden");
            }
            if (first.width > rect.width) {
                this.table.css("overflow-x", "scroll");
            }
            else {
                this.table.css("overflow-x", "hidden");
            }
        }
        setConnectionId(connectionId) {
            this.connectionId = connectionId;
        }
        newRow(rn, row) {
            let i = 0;
            const tr = document.createElement("div")
                .addClass("tr")
                .addClass(`tr${rn}`)
                .dataAttr("row", rn);
            if (!this.first) {
                this.first = tr;
            }
            this.last = tr;
            document.createElement("div").html(`${rn}`).appendElementTo(tr)
                .addClass("td")
                .addClass("th")
                .dataAttr("col", ++i)
                .dataAttr("row", rn)
                .on("mouseenter", (e) => this.cellMouseEnter(e.currentTarget))
                .on("mouseleave", (e) => this.cellMouseLeave(e.currentTarget));
            for (let item of row) {
                let td = document
                    .createElement("div")
                    .html(`${(item == null ? "NULL" : item)}`)
                    .appendElementTo(tr)
                    .addClass("td")
                    .addClass(`td${++i}`)
                    .dataAttr("col", i)
                    .dataAttr("row", rn)
                    .on("mouseenter", (e) => this.cellMouseEnter(e.currentTarget))
                    .on("mouseleave", (e) => this.cellMouseLeave(e.currentTarget));
                if (item == null) {
                    td.addClass("null");
                }
            }
            return tr;
        }
        onTableScroll() {
            if (this.cantLoadMore()) {
                return;
            }
            timeout_1.timeoutAsync(async () => {
                if (this.cantLoadMore()) {
                    return;
                }
                const { first, last } = this.calcPosition();
                if ((last > this.end && first > this.end) || (last < this.start && first < this.start)) {
                    const forDelete = Array.from(this.rows.keys());
                    this.start = first;
                    this.end = last;
                    await new Promise(resolve => {
                        api_1.cursor(this.connectionId, first, last, {
                            end: () => resolve(),
                            row: (rowNum, row) => {
                                const newRow = this.newRow(rowNum, row);
                                this.virtualBottom.before(newRow);
                                this.rows.set(rowNum, newRow);
                            }
                        });
                    });
                    for (let key of forDelete) {
                        this.rows.get(key).remove();
                        this.rows.delete(key);
                    }
                    this.calcVirtual();
                    return;
                }
                if (last > this.end && first >= this.start) {
                    await new Promise(resolve => {
                        api_1.cursor(this.connectionId, this.end + 1, last, {
                            end: () => resolve(),
                            row: (rowNum, row) => {
                                const newRow = this.newRow(rowNum, row);
                                this.virtualBottom.before(newRow);
                                const forDelete = this.rows.get(this.start);
                                if (forDelete) {
                                    forDelete.remove();
                                    this.rows.delete(this.start);
                                    this.start++;
                                }
                                if (rowNum > this.end) {
                                    this.end = rowNum;
                                }
                                this.rows.set(rowNum, newRow);
                            }
                        });
                    });
                    this.calcVirtual();
                    return;
                }
                if (last <= this.end && first < this.start) {
                    await new Promise(resolve => {
                        let last;
                        api_1.cursor(this.connectionId, first, this.start - 1, {
                            end: () => resolve(),
                            row: (rowNum, row) => {
                                let newRow = this.newRow(rowNum, row);
                                if (!last) {
                                    this.virtualTop.after(newRow);
                                }
                                else {
                                    last.after(newRow);
                                }
                                last = newRow;
                                const forDelete = this.rows.get(this.end);
                                if (forDelete) {
                                    forDelete.remove();
                                    this.rows.delete(this.end);
                                    this.end--;
                                }
                                if (rowNum < this.start) {
                                    this.start = rowNum;
                                }
                                this.rows.set(rowNum, newRow);
                            }
                        });
                    });
                    this.calcVirtual();
                    return;
                }
            }, 0, `${this.id}-grid-scroll`);
        }
        calcVirtual() {
            this.virtualBottom.css("height", ((this.stats.rowsAffected - this.end) * this.rowHeight) + "px");
            this.virtualTop.css("height", ((this.start - 1) * this.rowHeight) + "px");
        }
        calcPosition() {
            const tableRect = this.table.getBoundingClientRect();
            const firstEl = document.elementFromPoint(tableRect.x, tableRect.y + this.headerHeight);
            const lastEl = document.elementFromPoint(tableRect.x, tableRect.y + this.table.clientHeight - 1);
            let first = firstEl.dataAttr("row");
            if (first == undefined) {
                if (firstEl.dataAttr("bottom")) {
                    const bottomRect = this.virtualBottom.getBoundingClientRect();
                    first = this.end + Math.ceil(((tableRect.top + this.headerHeight) - bottomRect.top) / this.rowHeight);
                }
                else if (firstEl.parentElement.dataAttr("top")) {
                    const topRect = this.virtualTop.getBoundingClientRect();
                    first = this.start - Math.ceil((topRect.bottom - (tableRect.top + this.headerHeight)) / this.rowHeight);
                }
            }
            let last = lastEl.dataAttr("row");
            if (last == undefined) {
                if (lastEl.dataAttr("bottom")) {
                    const bottomRect = this.virtualBottom.getBoundingClientRect();
                    last = this.end + Math.ceil((tableRect.bottom - bottomRect.top) / this.rowHeight);
                }
                else if (lastEl.parentElement.dataAttr("top")) {
                    const topRect = this.virtualTop.getBoundingClientRect();
                    last = this.start - Math.ceil((topRect.bottom - tableRect.bottom) / this.rowHeight);
                }
            }
            return { first, last };
        }
        cantLoadMore() {
            return !this.connectionId || !this.stats || this.stats.rowsAffected == this.stats.rowsFetched;
        }
        headerCellMousemove(e) {
            if (this.moving) {
                return;
            }
            const cell = e.currentTarget;
            const rect = cell.getBoundingClientRect();
            if (e.offsetX < 2) {
                document.body.css("cursor", "col-resize");
                this.toMove = cell.previousElementSibling;
            }
            else if (e.offsetX > rect.width - 4) {
                document.body.css("cursor", "col-resize");
                this.toMove = cell;
            }
            else {
                document.body.css("cursor", "default");
                this.toMove = null;
            }
        }
        cellMouseEnter(cell) {
            cell.addClass("highlight");
            cell.parentElement.firstElementChild.addClass("highlight");
            this.header.find(`div.td${cell.dataAttr("col")}`).addClass("highlight");
        }
        cellMouseLeave(cell) {
            cell.removeClass("highlight");
            cell.parentElement.firstElementChild.removeClass("highlight");
            this.header.find(`div.td${cell.dataAttr("col")}`).removeClass("highlight");
        }
        mousedown(e) {
            if (!this.table) {
                return;
            }
            if (this.toMove) {
                this.moving = true;
                document.body.css("cursor", "col-resize");
                this.toMove.css("border-right-style", "dotted");
                if (this.toMove.nextElementSibling) {
                    this.toMove.nextElementSibling.css("border-left-style", "dotted");
                }
                this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("col")}`).css("border-right-style", "dotted");
                this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("col") + 1}`).css("border-left-style", "dotted");
            }
        }
        mouseup(e) {
            if (!this.table) {
                return;
            }
            this.moving = false;
            document.body.css("cursor", "default");
            if (!this.toMove) {
                return;
            }
            this.toMove.css("border-right-style", "");
            if (this.toMove.nextElementSibling) {
                this.toMove.nextElementSibling.css("border-left-style", "");
            }
            const i = this.toMove.dataAttr("col");
            this.table.findAll(`div.tr > div.td${i}`).css("border-right-style", "");
            this.table.findAll(`div.tr > div.td${i + 1}`).css("border-left-style", "");
            this.toMove = null;
        }
        mousemove(e) {
            if (!this.table) {
                return;
            }
            if (!this.moving) {
                const t = e.target;
                if (!t.parentElement || (!t.parentElement.hasClass("th") && !t.parentElement.parentElement.hasClass("th"))) {
                    document.body.css("cursor", "default");
                    this.toMove = null;
                    this.moving = false;
                }
                return;
            }
            const rect = this.toMove.getBoundingClientRect();
            const w = (e.clientX - rect.x - 11) + "px";
            this.toMove.css("min-width", w).css("max-width", w);
            const i = this.toMove.dataAttr("col");
            this.table.findAll(`div.tr > div.td${i}`).css("min-width", w).css("max-width", w);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=grid.js.map