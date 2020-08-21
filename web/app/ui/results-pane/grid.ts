import { IHeader, IStats } from "app/api";
import { timeout } from "app/_sys/timeout";

export default class  {
    private readonly element: Element;
    private readonly id: string;
    private table: Element;
    private header: Element;
    private last: Element;
    private first: Element;
    private headerHeight: number;
    private toMove: Element;
    private moving = false;
    private stats: IStats;
    private start: number;
    private end: number;

    constructor(id: string, element: Element) {
        this.id = id;
        this.element = element;
        this.table = null;
    }

    init() {
        this.element.html("");
        this.table = document.createElement("div").appendElementTo(this.element).addClass("table").on("scroll", e => this.onTableScroll())
        this.last = null;
        this.first = null;
        window
            .on("mousedown", (e:MouseEvent)=>this.mousedown(e))
            .on("mouseup", (e:MouseEvent)=>this.mouseup(e))
            .on("mousemove", (e:MouseEvent)=>this.mousemove(e))
            .on("resize", () => this.adjust());
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
        }
        this.headerHeight = this.header.clientHeight;
    }

    addRow(rn: number, row: Array<string>) {
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
                .on("mouseenter", (e: MouseEvent)=>this.cellMouseEnter(e.currentTarget as Element))
                .on("mouseleave", (e: MouseEvent)=>this.cellMouseLeave(e.currentTarget as Element));
            if (item == null) {
                td.addClass("null");
            }
        }
    }

    done(stats: IStats) {
        this.stats = stats;
        this.start = 1;
        this.end = stats.rowsFetched;
    }

    adjust() {
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

    private onTableScroll() {
        if (this.cantLoadMore()) {
            return
        }
        timeout(() => {
            if (this.cantLoadMore()) {
                return
            }
            const rect = this.table.getBoundingClientRect() as DOMRect;
            const first = document.elementFromPoint(rect.x, rect.y + this.headerHeight).parentElement.dataAttr("row") as number;
            const last = document.elementFromPoint(rect.x, rect.y + this.table.clientHeight - 5).parentElement.dataAttr("row") as number;
            if (first == undefined || last == undefined) {
                return
            }
            const page = this.end - this.start
            const mid = Math.round(page / 2);
            const half = Math.round((last - first) / 2);

            if (last > mid + half && last < this.stats.rowsAffected)  {
                const from = this.end + 1;
                let to = from + page;
                if (to > this.stats.rowsAffected) {
                    to = this.stats.rowsAffected
                }
                if (to <= this.stats.rowsAffected) {
                    console.log("load from", from, " to ", to);
                    console.log("remove from", this.start, " to ", this.start + (to - from));
                    console.log();
                }
            }

        }, 75, `${this.id}-grid-scroll`);
    }

    private cantLoadMore() {
        return !this.stats || this.stats.rowsAffected == this.stats.rowsFetched;
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
