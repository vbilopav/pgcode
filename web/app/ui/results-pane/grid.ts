import { IHeader, IStats, cursor } from "app/api";
import { timeoutAsync } from "app/_sys/timeout";

export default class  {
    private readonly element: Element;
    private readonly id: string;
    private readonly rows = new Map<number, Element>();
    private table: Element = null;
    private header: Element = null;
    private last: Element = null;
    private first: Element = null;
    private headerHeight: number = null;
    private rowHeight: number = null;
    private toMove: Element = null;
    private moving = false;
    private stats: IStats = null;
    private start: number = null;
    private end: number = null;
    private connectionId: string = null;
    private virtualTop: Element = null;
    private virtualBottom: Element = null;

    constructor(id: string, element: Element) {
        this.id = id;
        this.element = element;
        window
            .on("mousedown", (e:MouseEvent)=>this.mousedown(e))
            .on("mouseup", (e:MouseEvent)=>this.mouseup(e))
            .on("mousemove", (e:MouseEvent)=>this.mousemove(e))
            .on("resize", () => this.adjust());
    }

    init() {
        this.element.html("");
        this.table = document.createElement("div").appendElementTo(this.element).addClass("table").on("scroll", e => this.onTableScroll())
        this.header = null;
        this.last = null;
        this.first = null;
        this.rowHeight = null;
        this.virtualTop = null;
        this.virtualBottom = null;
        this.rows.clear();
    }

    addHeader(header: IHeader[]) {
        let i = 0;
        this.header = document.createElement("div").appendElementTo(this.table).addClass("th").dataAttr("row", 0) as Element;
        document.createElement("div").appendElementTo(this.header)
            .addClass("td")
            .addClass(`td${++i}`)
            .dataAttr("col", i)
            .on("mouseenter", (e: MouseEvent)=>this.cellMouseEnter(e.currentTarget as Element))
            .on("mouseleave", (e: MouseEvent)=>this.cellMouseLeave(e.currentTarget as Element));
        this.virtualTop = document.createElement("div").css("display", "table-row").css("height", "0px").dataAttr("top", true);
        for(let item of header) {
            document
                .createElement("div")
                .html(`<div>${item.name}</div><div>${item.type}</div>`)
                .appendElementTo(this.header)
                .addClass("td")
                .addClass(`td${++i}`)
                .dataAttr("col", i)
                .on("mousemove", (e: MouseEvent)=>this.headerCellMousemove(e))
                .on("mouseenter", (e: MouseEvent)=>this.cellMouseEnter(e.currentTarget as Element))
                .on("mouseleave", (e: MouseEvent)=>this.cellMouseLeave(e.currentTarget as Element));

            document.createElement("div").css("display", "table-cell").appendElementTo(this.virtualTop);
        }
        this.headerHeight = this.header.clientHeight;
        this.virtualTop.appendElementTo(this.table);
    }

    addRow(rn: number, row: Array<string>) {
        const e = this.newRow(rn, row).appendElementTo(this.table);
        this.rows.set(rn, e);
        if (this.rowHeight == null) {
            this.rowHeight = e.clientHeight;
        }
    }

    done(stats: IStats) {
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
        const rect = this.element.parentElement.getBoundingClientRect() as DOMRect;
        this.table.css("height", rect.height + "px");
        if (this.last == null || this.first == null) {
            return;
        }
        const last = this.last.getBoundingClientRect() as DOMRect;
        const first = this.first.getBoundingClientRect() as DOMRect;
        if (first.y < rect.y || last.y > (rect.y + rect.height)) {
            this.table.css("overflow-y", "scroll");
        } else {
            this.table.css("overflow-y", "hidden");
        }
        if (first.width > rect.width) {
            this.table.css("overflow-x", "scroll");
        } else {
            this.table.css("overflow-x", "hidden");
        }
    }

    setConnectionId(connectionId: string) {
        this.connectionId = connectionId;
    }

    private newRow(rn: number, row: Array<string>) : Element {
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
            .on("mouseenter", (e: MouseEvent)=>this.cellMouseEnter(e.currentTarget as Element))
            .on("mouseleave", (e: MouseEvent)=>this.cellMouseLeave(e.currentTarget as Element));
        for(let item of row) {
            let td = document
                .createElement("div")
                .html(`${(item == null? "NULL" : item)}`)
                .appendElementTo(tr)
                .addClass("td")
                .addClass(`td${++i}`)
                .dataAttr("col", i)
                .dataAttr("row", rn)
                .on("mouseenter", (e: MouseEvent)=>this.cellMouseEnter(e.currentTarget as Element))
                .on("mouseleave", (e: MouseEvent)=>this.cellMouseLeave(e.currentTarget as Element));
            if (item == null) {
                td.addClass("null");
            }
        }
        return tr;
    }

    private onTableScroll() {
        if (this.cantLoadMore()) {
            return
        }
        timeoutAsync(async () => {
            if (this.cantLoadMore()) {
                return
            }
            const {first, last} = this.calcPosition();

            if ((last > this.end && first > this.end) || (last < this.start && first < this.start)) {
                const forDelete = Array.from(this.rows.keys());
                this.start = first;
                this.end = last;
                await new Promise<void>(resolve => {
                    cursor(this.connectionId, first, last, {
                        end: () => resolve(),
                        row: (rowNum, row: Array<string>) => {
                            const newRow = this.newRow(rowNum, row);
                            this.virtualBottom.before(newRow);
                            this.rows.set(rowNum, newRow);
                        }
                    });
                });
                for(let key of forDelete) {
                    this.rows.get(key).remove();
                    this.rows.delete(key);
                }
                this.calcVirtual();
                return;
            }

            if (last > this.end && first >= this.start) {
                await new Promise<void>(resolve => {
                    cursor(this.connectionId, this.end + 1, last, {
                        end: () => resolve(),
                        row: (rowNum, row: Array<string>) => {
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
                await new Promise<void>(resolve => {
                    let last: Element;
                    cursor(this.connectionId, first, this.start - 1, {
                        end: () => resolve(),
                        row: (rowNum, row: Array<string>) => {
                            let newRow = this.newRow(rowNum, row);
                            if (!last) {
                                this.virtualTop.after(newRow);
                            } else {
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

    private calcVirtual() {
        this.virtualBottom.css("height", ((this.stats.rowsAffected - this.end) * this.rowHeight) + "px");
        this.virtualTop.css("height", ((this.start - 1) * this.rowHeight) + "px");
    }

    private calcPosition() {
        const tableRect = this.table.getBoundingClientRect() as DOMRect;
        const firstEl = document.elementFromPoint(tableRect.x, tableRect.y + this.headerHeight);
        const lastEl = document.elementFromPoint(tableRect.x, tableRect.y + this.table.clientHeight - 1);
        
        let first = firstEl.dataAttr("row") as number;
        if (first == undefined) {
            if (firstEl.dataAttr("bottom")) {
                const bottomRect = this.virtualBottom.getBoundingClientRect() as DOMRect;
                first = this.end + Math.ceil(((tableRect.top + this.headerHeight) - bottomRect.top) / this.rowHeight);
            } else if (firstEl.parentElement.dataAttr("top")) {
                const topRect = this.virtualTop.getBoundingClientRect() as DOMRect;
                first = this.start - Math.ceil((topRect.bottom - (tableRect.top + this.headerHeight)) / this.rowHeight);
            }
        }
        
        let last = lastEl.dataAttr("row") as number;
        if (last == undefined) {
            if (lastEl.dataAttr("bottom")) {
                const bottomRect = this.virtualBottom.getBoundingClientRect() as DOMRect;
                last = this.end + Math.ceil((tableRect.bottom - bottomRect.top) / this.rowHeight);
            } else if (lastEl.parentElement.dataAttr("top")) {
                const topRect = this.virtualTop.getBoundingClientRect() as DOMRect;
                last = this.start - Math.ceil((topRect.bottom -  tableRect.bottom) / this.rowHeight);
            }
        }

        return {first, last}
    }

    private cantLoadMore() {
        return !this.connectionId || !this.stats || this.stats.rowsAffected == this.stats.rowsFetched;
    }

    private headerCellMousemove(e: MouseEvent) {
        if (this.moving) {
            return;
        }
        const cell = e.currentTarget as Element;
        const rect = cell.getBoundingClientRect();
        if (e.offsetX < 2) {
            document.body.css("cursor", "col-resize");
            this.toMove = cell.previousElementSibling;
        } else if (e.offsetX > rect.width - 4) {
            document.body.css("cursor", "col-resize");
            this.toMove = cell;
        } else {
            document.body.css("cursor", "default");
            this.toMove = null;
        }
    }

    private cellMouseEnter(cell: Element) {
        cell.addClass("highlight");
        cell.parentElement.firstElementChild.addClass("highlight");
        this.header.find(`div.td${cell.dataAttr("col")}`).addClass("highlight");
    }

    private cellMouseLeave(cell: Element) {
        cell.removeClass("highlight");
        cell.parentElement.firstElementChild.removeClass("highlight");
        this.header.find(`div.td${cell.dataAttr("col")}`).removeClass("highlight");
    }

    private mousedown(e: MouseEvent) {
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
            this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("col")+1}`).css("border-left-style", "dotted");
        }
    }

    private mouseup(e: MouseEvent) {
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
        this.table.findAll(`div.tr > div.td${i+1}`).css("border-left-style", "");
        this.toMove = null;
    }

    private mousemove(e: MouseEvent) {
        if (!this.table) {
            return;
        }
        if (!this.moving) {
            const t = (e.target as Element);
            if (!t.parentElement || (!t.parentElement.hasClass("th") && !t.parentElement.parentElement.hasClass("th"))) {
                document.body.css("cursor", "default");
                this.toMove = null;
                this.moving = false;
            }
            return;
        }
        const rect = this.toMove.getBoundingClientRect() as DOMRect;
        const w = (e.clientX - rect.x - 11) + "px";
        this.toMove.css("min-width", w).css("max-width", w);
        const i = this.toMove.dataAttr("col");
        this.table.findAll(`div.tr > div.td${i}`).css("min-width", w).css("max-width", w);
    }
}
