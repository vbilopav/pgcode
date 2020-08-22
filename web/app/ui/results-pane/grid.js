define(["require", "exports", "app/api", "app/_sys/timeout"], function (require, exports, api_1, timeout_1) {
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
            this.newRow(rn, row).appendElementTo(this.table);
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
            return tr;
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
        setConnectionId(connectionId) {
            this.connectionId = connectionId;
        }
        onTableScroll() {
            if (this.cantLoadMore()) {
                return;
            }
            timeout_1.timeoutAsync(async () => {
                if (this.cantLoadMore()) {
                    return;
                }
                const rect = this.table.getBoundingClientRect();
                const first = document.elementFromPoint(rect.x, rect.y + this.headerHeight).parentElement.dataAttr("row");
                const last = document.elementFromPoint(rect.x, rect.y + this.table.clientHeight - 5).parentElement.dataAttr("row");
                const viewPage = last - first;
                const page = viewPage * 2;
                if (this.end < this.stats.rowsAffected && last >= (this.end - viewPage)) {
                    let addFrom = this.end + 1;
                    let addTo = addFrom + page;
                    if (addTo > this.stats.rowsAffected) {
                        addTo = this.stats.rowsAffected;
                    }
                    let removeFrom = this.start;
                    let removeTo = this.start + addTo - addFrom;
                    console.log("adding (" + (addTo - addFrom) + ")", addFrom, addTo, "     removing(" + (removeTo - removeFrom) + ")", removeFrom, removeTo);
                    const removal = new Array();
                    this.table.css("overflow-y", "hidden");
                    for (let row of this.table.children) {
                        let rn = row.dataAttr("row");
                        if (rn == 0) {
                            continue;
                        }
                        if (rn >= removeFrom && rn <= removeTo) {
                            removal.push(row);
                        }
                        else {
                            break;
                        }
                    }
                    removal.forEach(r => r.remove());
                    await new Promise(resolve => {
                        api_1.cursor(this.connectionId, addFrom, addTo, {
                            end: () => resolve(),
                            row: (rowNum, newRow) => this.addRow(rowNum, newRow)
                        });
                    });
                    this.start = removeTo + 1;
                    this.end = addTo;
                    this.adjust();
                }
                if (this.start > 1 && first <= (this.start + viewPage)) {
                    let addFrom = this.start - page;
                    if (addFrom < 1) {
                        addFrom = 1;
                    }
                    let addTo = this.start - 1;
                    let removeFrom = this.end - page;
                    let removeTo = this.end;
                    console.log("adding (" + (addTo - addFrom) + ")", addFrom, addTo, "     removing(" + (removeTo - removeFrom) + ")", removeFrom, removeTo);
                    const removal = new Array();
                    this.table.css("overflow-y", "hidden");
                    for (let row of this.table.children) {
                        let rn = row.dataAttr("row");
                        if (rn == 0) {
                            continue;
                        }
                        if (rn >= removeFrom && rn <= removeTo) {
                            removal.push(row);
                        }
                    }
                    removal.forEach(r => r.remove());
                    let last;
                    await new Promise(resolve => {
                        api_1.cursor(this.connectionId, addFrom, addTo, {
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
                            }
                        });
                    });
                    this.start = addFrom;
                    this.end = removeFrom - 1;
                    this.adjust();
                }
                console.log(this.table.children.length);
            }, 75, `${this.id}-grid-scroll`);
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