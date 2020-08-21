define(["require", "exports", "app/_sys/timeout"], function (require, exports, timeout_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(id, element) {
            this.moving = false;
            this.id = id;
            this.element = element;
            this.table = null;
        }
        init() {
            this.element.html("");
            this.table = document.createElement("div").appendElementTo(this.element).addClass("table").on("scroll", e => this.onTableScroll());
            this.last = null;
            this.first = null;
            window
                .on("mousedown", (e) => this.mousedown(e))
                .on("mouseup", (e) => this.mouseup(e))
                .on("mousemove", (e) => this.mousemove(e))
                .on("resize", () => this.adjust());
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
            }
            this.headerHeight = this.header.clientHeight;
        }
        addRow(rn, row) {
            let i = 0;
            const tr = document.createElement("div").appendElementTo(this.table)
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
                    .on("mouseenter", (e) => this.cellMouseEnter(e.currentTarget))
                    .on("mouseleave", (e) => this.cellMouseLeave(e.currentTarget));
                if (item == null) {
                    td.addClass("null");
                }
            }
        }
        done(stats) {
            this.stats = stats;
            this.start = 1;
            this.end = stats.rowsFetched;
        }
        adjust() {
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
        onTableScroll() {
            if (this.cantLoadMore()) {
                return;
            }
            timeout_1.timeout(() => {
                if (this.cantLoadMore()) {
                    return;
                }
                const rect = this.table.getBoundingClientRect();
                const first = document.elementFromPoint(rect.x, rect.y + this.headerHeight).parentElement.dataAttr("row");
                const last = document.elementFromPoint(rect.x, rect.y + this.table.clientHeight - 5).parentElement.dataAttr("row");
                if (first == undefined || last == undefined) {
                    return;
                }
                const page = this.end - this.start;
                const mid = Math.round(page / 2);
                const half = Math.round((last - first) / 2);
                if (last > mid + half && last < this.stats.rowsAffected) {
                    const from = this.end + 1;
                    let to = from + page;
                    if (to > this.stats.rowsAffected) {
                        to = this.stats.rowsAffected;
                    }
                    if (to <= this.stats.rowsAffected) {
                        console.log("load from", from, " to ", to);
                        console.log("remove from", this.start, " to ", this.start + (to - from));
                        console.log();
                    }
                }
            }, 75, `${this.id}-grid-scroll`);
        }
        cantLoadMore() {
            return !this.stats || this.stats.rowsAffected == this.stats.rowsFetched;
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