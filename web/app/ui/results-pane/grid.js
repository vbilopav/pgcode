define(["require", "exports", "app/api"], function (require, exports, api_1) {
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
            this.rowWidths = new Array();
            this.scroll = null;
            this.scroller = null;
            this._shouldScroll = false;
            this._started = false;
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
            this.table = document.createElement("div").appendElementTo(this.element).addClass("table").on("wheel", (e) => this.onTableWheel(e));
            this.scroll = document.createElement("div").addClass("v-scroll").appendElementTo(this.element).on("scroll", e => this.onTableScroll());
            this.scroller = document.createElement("div").appendElementTo(this.scroll);
            this.header = null;
            this.last = null;
            this.first = null;
            this.rows.clear();
            this.startGridScrollConsumer();
            this.rowWidths = new Array();
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
                ;
            }
            this.headerHeight = this.header.clientHeight;
        }
        addRow(rn, row) {
            const e = this.newRow(rn, row).appendElementTo(this.table);
            this.rows.set(rn, e);
            if (this.rowHeight == null) {
                this.rowHeight = e.clientHeight;
            }
        }
        done(stats) {
            this.stats = Object.assign({}, stats);
            this.start = 1;
            this.end = this.stats.rowsFetched;
            this.calcVirtual();
            this.adjustGridScrollBars();
            if (this.header) {
                let i = 0;
                for (let cell of this.header.children) {
                    this.rowWidths[i++] = cell.clientWidth;
                    const w = cell.clientWidth + "px";
                    cell.css("min-width", w).css("max-width", w);
                    this.table.findAll(`div.tr > div.td${cell.dataAttr("col")}`).css("min-width", w).css("max-width", w);
                }
            }
        }
        adjust() {
            this.onTableScroll();
            this.adjustGridScrollBars();
        }
        setConnectionId(connectionId) {
            this.connectionId = connectionId;
        }
        adjustGridScrollBars() {
            if (!this.table) {
                return;
            }
            this.table.css("height", this.element.clientHeight + "px");
            if (this.scroller.clientHeight > this.table.clientHeight) {
                this.scroll.showElement();
                this.element.css("grid-template-columns", "auto 16px");
            }
            else {
                this.scroll.hideElement();
                this.element.css("grid-template-columns", "auto 0px");
            }
            if (this.header.clientWidth > this.element.clientWidth) {
                this.table.css("overflow-x", "scroll");
            }
            else {
                this.table.css("overflow-x", "hidden");
            }
        }
        estimateNumberOfItems() {
            return Math.trunc(this.table.scrollHeight / (this.rowHeight ? this.rowHeight : 25));
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
            let td = document.createElement("div").html(`${rn}`).appendElementTo(tr)
                .addClass("td")
                .addClass("th")
                .dataAttr("col", ++i)
                .dataAttr("row", rn)
                .on("mouseenter", (e) => this.cellMouseEnter(e.currentTarget))
                .on("mouseleave", (e) => this.cellMouseLeave(e.currentTarget));
            if (this.rowWidths.length) {
                let w = this.rowWidths[i - 1] + "px";
                td.css("min-width", w).css("max-width", w);
            }
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
                if (this.rowWidths.length) {
                    let w = this.rowWidths[i - 1] + "px";
                    td.css("min-width", w).css("max-width", w);
                }
            }
            return tr;
        }
        async onTableWheel(e) {
            if (this.scroll == null) {
                return;
            }
            this.scroll.scrollTop = this.scroll.scrollTop + e.deltaY;
        }
        onTableScroll() {
            if (!this.connectionId || !this.stats) {
                return;
            }
            if (this._timeout) {
                clearTimeout(this._timeout);
                this._timeout = undefined;
            }
            this._timeout = setTimeout(() => {
                if (this._timeout) {
                    clearTimeout(this._timeout);
                    this._timeout = undefined;
                }
                this._shouldScroll = true;
            }, 0);
        }
        async startGridScrollConsumer() {
            setTimeout(async () => {
                if (this._shouldScroll) {
                    this._shouldScroll = false;
                    if (this._started) {
                        return;
                    }
                    this._started = true;
                    await this.scrollTable();
                    this._started = false;
                }
                await this.startGridScrollConsumer();
            }, 0);
        }
        async scrollTable() {
            if (this.scroll == null) {
                return { first: undefined, last: undefined };
            }
            let first = Math.trunc(this.scroll.scrollTop / this.rowHeight);
            let last = Math.trunc((this.scroll.scrollTop + this.scroll.offsetHeight) / this.rowHeight);
            if (first < 1) {
                first = 1;
            }
            if (last > this.stats.rowsAffected) {
                last = this.stats.rowsAffected;
            }
            if ((last > this.end && first > this.end) ||
                (last < this.start && first < this.start) ||
                (last > this.end && first < this.end)) {
                this.rows.forEach(r => r.remove());
                this.rows.clear();
                this.start = first;
                this.end = last;
                await new Promise(resolve => {
                    api_1.cursor(this.connectionId, first, last, {
                        end: () => resolve(),
                        row: (rowNum, row) => {
                            const newRow = this.newRow(rowNum, row);
                            newRow.appendElementTo(this.table);
                            this.rows.set(rowNum, newRow);
                        }
                    });
                });
            }
            else if (last > this.end && first >= this.start) {
                await new Promise(resolve => {
                    api_1.cursor(this.connectionId, this.end + 1, last, {
                        end: () => resolve(),
                        row: (rowNum, row) => {
                            const newRow = this.newRow(rowNum, row);
                            newRow.appendElementTo(this.table);
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
            }
            else if (last <= this.end && first < this.start) {
                await new Promise(resolve => {
                    let last;
                    api_1.cursor(this.connectionId, first, this.start - 1, {
                        end: () => resolve(),
                        row: (rowNum, row) => {
                            let newRow = this.newRow(rowNum, row);
                            if (!last) {
                                this.header.after(newRow);
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
            }
            if (first + ((last - first) / 2) < this.stats.rowsAffected / 2) {
                this.table.scrollTo({ top: ((first - 1) * this.rowHeight) + (this.scroll.scrollTop % this.rowHeight), behavior: 'auto' });
            }
            else {
                this.table.scrollTo({ top: (first * this.rowHeight) + (this.scroll.scrollTop % this.rowHeight), behavior: 'auto' });
            }
        }
        calcVirtual() {
            if (this.stats.rowsAffected == -1) {
                return;
            }
            this.scroller.css("height", (this.stats.rowsAffected * this.rowHeight) + this.headerHeight + "px");
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
            const wl = (e.clientX - rect.x - 11);
            const w = wl + "px";
            this.toMove.css("min-width", w).css("max-width", w);
            const i = this.toMove.dataAttr("col");
            this.table.findAll(`div.tr > div.td${i}`).css("min-width", w).css("max-width", w);
            if (this.rowWidths.length) {
                this.rowWidths[i - 1] = wl;
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=grid.js.map