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
            const th = document.createElement("div").appendElementTo(this.table).addClass("th").dataAttr("rn", 0);
            document.createElement("div").appendElementTo(th)
                .addClass("td")
                .on("mouseenter", (e) => this.cellMouseEnter(e.currentTarget))
                .on("mouseleave", (e) => this.cellMouseLeave(e.currentTarget));
            let i = 1;
            for (let item of header) {
                document
                    .createElement("div")
                    .html(`<div>${item.name}</div><div>${item.type}</div>`)
                    .appendElementTo(th)
                    .addClass("td")
                    .dataAttr("i", i++)
                    .on("mousemove", (e) => this.headerCellMousemove(e))
                    .on("mouseenter", (e) => this.cellMouseEnter(e.currentTarget))
                    .on("mouseleave", (e) => this.cellMouseLeave(e.currentTarget));
            }
            this.headerHeight = th.clientHeight;
        }
        addRow(rn, row) {
            const tr = document.createElement("div").appendElementTo(this.table).addClass("tr").dataAttr("rn", rn);
            if (!this.first) {
                this.first = tr;
            }
            this.last = tr;
            document.createElement("div").html(`${rn}`).appendElementTo(tr)
                .addClass("td")
                .addClass("th")
                .on("mouseenter", (e) => this.cellMouseEnter(e.currentTarget))
                .on("mouseleave", (e) => this.cellMouseLeave(e.currentTarget));
            let i = 1;
            for (let item of row) {
                let td = document
                    .createElement("div")
                    .html(`${(item == null ? "NULL" : item)}`)
                    .appendElementTo(tr)
                    .addClass("td")
                    .addClass(`td${i++}`)
                    .on("mouseenter", (e) => this.cellMouseEnter(e.currentTarget))
                    .on("mouseleave", (e) => this.cellMouseLeave(e.currentTarget));
                if (item == null) {
                    td.addClass("null");
                }
            }
        }
        done(stats, hasError) {
            this.stats = stats;
            this.hasError = hasError;
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
            if (this.cantLoadMore) {
                return;
            }
            timeout_1.timeout(() => {
                if (this.cantLoadMore) {
                    return;
                }
                const rect = this.table.getBoundingClientRect();
                const first = document.elementFromPoint(rect.x, rect.y + this.headerHeight).parentElement;
                const last = document.elementFromPoint(rect.x, rect.y + this.table.clientHeight - 5).parentElement;
                console.log(first.dataAttr("rn"), last.dataAttr("rn"));
            }, 75, `${this.id}-grid-scroll`);
        }
        cantLoadMore() {
            return !this.stats || this.hasError || this.stats.rowsAffected == this.stats.rowsFetched;
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
        }
        cellMouseLeave(cell) {
        }
        mousedown(e) {
            if (this.toMove) {
                this.moving = true;
                document.body.css("cursor", "col-resize");
                this.toMove.css("border-right-style", "dotted");
                if (this.toMove.nextElementSibling) {
                    this.toMove.nextElementSibling.css("border-left-style", "dotted");
                }
                this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("i")}`).css("border-right-style", "dotted");
                this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("i") + 1}`).css("border-left-style", "dotted");
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
            this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("i")}`).css("border-right-style", "");
            this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("i") + 1}`).css("border-left-style", "");
            this.toMove = null;
        }
        mousemove(e) {
            if (!this.moving) {
                if (!e.target.parentElement.hasClass("th") && !e.target.parentElement.parentElement.hasClass("th")) {
                    document.body.css("cursor", "default");
                    this.toMove = null;
                    this.moving = false;
                }
                return;
            }
            const rect = this.toMove.getBoundingClientRect();
            const w = (e.clientX - rect.x - 11) + "px";
            this.toMove.css("min-width", w).css("max-width", w);
            this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("i")}`).css("min-width", w).css("max-width", w);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=grid.js.map