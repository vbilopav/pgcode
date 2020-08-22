import { IHeader, IStats, cursor } from "app/api";
import { timeoutAsync } from "app/_sys/timeout";

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
    private connectionId: string;

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
        this.newRow(rn, row).appendElementTo(this.table);
    }

    newRow(rn: number, row: Array<string>) : Element {
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
        return tr;
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

    setConnectionId(connectionId: string) {
        this.connectionId = connectionId;
    }

    private onTableScroll() {
        if (this.cantLoadMore()) {
            return
        }
        timeoutAsync(async () => {
            if (this.cantLoadMore()) {
                return
            }
            const rect = this.table.getBoundingClientRect() as DOMRect;
            const first = document.elementFromPoint(rect.x, rect.y + this.headerHeight).parentElement.dataAttr("row") as number;
            const last = document.elementFromPoint(rect.x, rect.y + this.table.clientHeight - 5).parentElement.dataAttr("row") as number;
            const viewPage = last - first;
            const page = viewPage * 2;
            
            if (this.end < this.stats.rowsAffected && last >= (this.end - viewPage)) {
                let addFrom = this.end + 1;
                let addTo = addFrom + page;
                if (addTo > this.stats.rowsAffected) {
                    addTo = this.stats.rowsAffected
                }
                let removeFrom = this.start;
                let removeTo = this.start + addTo - addFrom;
                console.log("adding (" + (addTo - addFrom) + ")", addFrom, addTo, "     removing(" + (removeTo - removeFrom) + ")", removeFrom, removeTo);
                const removal = new Array<Element>();
                this.table.css("overflow-y", "hidden");
                for(let row of this.table.children) {
                    let rn = row.dataAttr("row");
                    if (rn == 0) {
                        continue;
                    }
                    if (rn >= removeFrom && rn <= removeTo) {
                        removal.push(row);
                    } else {
                        break;
                    }
                }
                removal.forEach(r => r.remove());
                await new Promise<void>(resolve => {
                    cursor(this.connectionId, addFrom, addTo, {
                        end: () => resolve(),
                        row: (rowNum, newRow: Array<string>) => this.addRow(rowNum, newRow)
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
                const removal = new Array<Element>();
                this.table.css("overflow-y", "hidden");
                for(let row of this.table.children) {
                    let rn = row.dataAttr("row");
                    if (rn == 0) {
                        continue;
                    }
                    if (rn >= removeFrom && rn <= removeTo) {
                        removal.push(row);
                    }
                }
                removal.forEach(r => r.remove());
                let last: Element;
                await new Promise<void>(resolve => {
                    cursor(this.connectionId, addFrom, addTo, {
                        end: () => resolve(),
                        row: (rowNum, row: Array<string>) => {
                            let newRow = this.newRow(rowNum, row);
                            if (!last) {
                                this.header.after(newRow);
                            } else {
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
