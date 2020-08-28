import { IHeader, IStats, cursor } from "app/api";

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
        this.startGridScrollConsumer();
        this._rowWidths = new Array<number>();
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
        document.createElement("div").css("display", "table-cell").appendElementTo(this.virtualTop);
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

    private _rowWidths = new Array<number>();

    done(stats: IStats) {
        this.stats = Object.assign({}, stats);
        this.start = 1;
        this.end = this.stats.rowsFetched;
        
        this.virtualBottom = document.createElement("div").appendElementTo(this.table).dataAttr("bottom", true).dataAttr("bottom", true);
        this.calcVirtual();
        if (this.header) {
            let i = 0;
            for(let cell of this.header.children) {
                this._rowWidths[i++] = cell.clientWidth;
                const w = cell.clientWidth + "px";
                cell.css("min-width", w).css("max-width", w);
                this.table.findAll(`div.tr > div.td${cell.dataAttr("col")}`).css("min-width", w).css("max-width", w);
                this.virtualTop.children[i-1].css("min-width", w).css("max-width", w);
            }
        }
    }

    adjust() {
        this.adjustGridScrollBars();
        this.scrollTable(true);
    }

    setConnectionId(connectionId: string) {
        this.connectionId = connectionId;
    }

    adjustGridScrollBars() {
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
        let td = document.createElement("div").html(`${rn}`).appendElementTo(tr)
            .addClass("td")
            .addClass("th")
            .dataAttr("col", ++i)
            .dataAttr("row", rn)
            .on("mouseenter", (e: MouseEvent)=>this.cellMouseEnter(e.currentTarget as Element))
            .on("mouseleave", (e: MouseEvent)=>this.cellMouseLeave(e.currentTarget as Element));
            
            if (this._rowWidths.length) {
                let w = this._rowWidths[i-1] + "px";
                td.css("min-width", w).css("max-width", w);
            }

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
            
            if (this._rowWidths.length) {
                let w = this._rowWidths[i-1] + "px";
                td.css("min-width", w).css("max-width", w);
            }
        }
        return tr;
    }

    private _shouldScroll = false;
    private _started = false;

    private onTableScroll() {
        if (this.cantLoadMore()) {
            return
        }
        this._shouldScroll = true;
        setTimeout(() => this._shouldScroll = true, 0);
    }

    private async startGridScrollConsumer() {
        setTimeout(async () => {
            if (this._shouldScroll) {
                this._shouldScroll = false;
                if (this._started) {
                    return;
                }
                this._started = true;
                await this.scrollTable(false);
                this._started = false;
            }
            await this.startGridScrollConsumer();
        }, 1);
    }

    private async scrollTable(precise: boolean) {
        if (this.cantLoadMore()) {
            return
        }
        const {first, last} = this.calcPosition(precise);
        if (first == undefined && last == undefined) {
            return;
        }
        if ((last > this.end && first > this.end) || (last < this.start && first < this.start)) {
            this.rows.forEach(r => r.remove());
            this.rows.clear();
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
    }

    private calcVirtual() {
        if (this.stats.rowsAffected == -1) {
            return;
        }
        let cap = 5000000;
        let bh = (this.stats.rowsAffected - this.end) * this.rowHeight;
        let th = (this.start - 1) * this.rowHeight;

        if (bh > cap || th > cap) {
            let bhv: number;
            let thv: number;
            if (bh >= th) {
                bhv = cap;
                thv = Math.round((cap * th) / bh);
            } else {
                thv = cap;
                bhv = Math.round((cap * bh) / th);
            }

            this.virtualTop.css("height", thv + "px").dataAttr("actual", th);
            this.virtualBottom.css("height", bhv + "px").dataAttr("actual", bh);

            console.log("virtual");
        } else {
            this.virtualTop.css("height", th + "px").dataAttr("actual", null);
            this.virtualBottom.css("height", bh + "px").dataAttr("actual", null);
        }
    }

    private calcPosition(precise: boolean) {
        const tableRect = this.table.getBoundingClientRect() as DOMRect;
        const firstEl = document.elementFromPoint(tableRect.x, tableRect.y + this.headerHeight + 1);
        const lastEl = document.elementFromPoint(tableRect.x, tableRect.y + this.table.clientHeight - 1);
        let virtual = false;
        let first = firstEl.dataAttr("row") as number;
        if (first == undefined) {
            if (firstEl.dataAttr("bottom")) {
                const actual = firstEl.dataAttr("actual");
                const bottomRect = this.virtualBottom.getBoundingClientRect() as DOMRect;
                const h = tableRect.top + this.headerHeight - bottomRect.top;
                if (actual == null) {
                    first = this.end + Math.ceil(h / this.rowHeight);
                } else {
                    console.log("debugger");
                    first = this.end + Math.ceil(((actual * h) / bottomRect.height) / this.rowHeight); // include actual height
                    virtual = true;
                    //return {first: undefined, last: undefined}
                }
            } else if (firstEl.parentElement.dataAttr("top")) {
                const actual = firstEl.dataAttr("actual");
                const topRect = this.virtualTop.getBoundingClientRect() as DOMRect;
                const h = topRect.bottom - tableRect.top + this.headerHeight
                if (actual == null) {
                    first = this.start - Math.ceil(h / this.rowHeight);
                } else {
                    console.log("debugger");
                    first = this.start - Math.ceil(((actual * h) / topRect.height) / this.rowHeight); // include actual height
                    virtual = true;
                    //return {first: undefined, last: undefined}
                }
            }
        }
        let last = lastEl.dataAttr("row") as number;
        if (last == undefined) {
            if (lastEl.dataAttr("bottom")) {
                const actual = lastEl.dataAttr("actual");
                const bottomRect = this.virtualBottom.getBoundingClientRect() as DOMRect;
                const h = tableRect.bottom - bottomRect.top;
                if (actual == null) {
                    last = this.end + Math.ceil(h / this.rowHeight);
                } else {
                    console.log("debugger");
                    last = this.end + Math.ceil(((actual * h) / bottomRect.height) / this.rowHeight); // include actual height
                    virtual = true;
                    //return {first: undefined, last: undefined}
                }
            } else if (lastEl.parentElement.dataAttr("top")) {
                const actual = lastEl.dataAttr("actual");
                const topRect = this.virtualTop.getBoundingClientRect() as DOMRect;
                const h = topRect.bottom -  tableRect.bottom;
                if (actual == null) {
                    last = this.start - Math.ceil(h / this.rowHeight);
                } else {
                    console.log("debugger");
                    last = this.start - Math.ceil(((actual * h) / topRect.height) / this.rowHeight); // include actual height
                    virtual = true;
                    //return {first: undefined, last: undefined}
                }
            }
        }

        const delta = precise ? 0 : last - first;
        if (first - delta < 1) {
            first = 1;
        } else {
            first = first - delta;
        }
        if (last + delta > this.stats.rowsAffected) {
            last = this.stats.rowsAffected;
        } else {
            last = last + delta;
        }

        if (virtual) {
            console.log(first, last);
            //return {first: undefined, last: undefined}
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
        const wl = (e.clientX - rect.x - 11);
        const w = wl + "px";
        this.toMove.css("min-width", w).css("max-width", w);
        const i = this.toMove.dataAttr("col");
        this.table.findAll(`div.tr > div.td${i}`).css("min-width", w).css("max-width", w);
        if (this._rowWidths.length) {
            this._rowWidths[i-1] = wl;
        }
    }
}
