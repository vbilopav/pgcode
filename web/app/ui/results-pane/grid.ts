import { IExecuteResponse, cursor } from "app/api";

export default class  {
    private readonly element: Element;
    private readonly id: string;
    private readonly rows = new Map<number, Element>();
    private table: HTMLElement = null;
    private header: Element = null;
    private last: Element = null;
    private first: Element = null;
    private headerHeight: number = null;
    private readonly rowHeight: number = 25;
    private toMove: Element = null;
    private moving = false;

    private response: IExecuteResponse = null;
    private start: number = null;
    private end: number = null;
    private rowWidths = new Array<number>();

    private scroll: HTMLElement = null;
    private scroller: Element = null;

    private shouldScroll = false;
    private scrollStarted = false;
    private scrollTimeout: number;

    constructor(id: string, element: Element) {
        this.id = id;
        this.element = element;
        window
            .on("mousedown", (e:MouseEvent)=>this.mousedown(e))
            .on("mouseup", (e:MouseEvent)=>this.mouseup(e))
            .on("mousemove", (e:MouseEvent)=>this.mousemove(e))
            .on("resize", () => this.adjust());
        this.startGridScrollConsumer();
    }

    init() {
        this.element.html("");
        this.table = document.createElement("div").appendElementTo(this.element).addClass("table").on("wheel", (e: WheelEvent) => this.onTableWheel(e)) as HTMLElement;
        
        this.scroll = document.createElement("div").addClass("v-scroll").appendElementTo(this.element).on("scroll", e => this.onTableScroll()) as HTMLElement;
        this.scroller = document.createElement("div").appendElementTo(this.scroll);

        this.header = null;
        this.last = null;
        this.first = null;
        this.start = null;
        this.end = null;
        this.rows.clear();
        this.shouldScroll = false;
        this.rowWidths = new Array<number>();
    }

    done(response: IExecuteResponse) {
        this.response = Object.assign({}, response);
        this.addHeader();
        if (this.header) {
            let i = 0;
            for(let cell of this.header.children) {
                this.rowWidths[i++] = cell.clientWidth;
                let w: string;
                if (i == 1) {
                    w = (this.response.rowsAffected.toString().length * 8) + "px";
                } else {
                    w = cell.clientWidth + "px";
                }
                cell.css("min-width", w).css("max-width", w);
                const h = this.table.findAll(`div.tr > div.td${cell.dataAttr("col")}`);
                h.css("min-width", w).css("max-width", w);
            }
        }

        this.scroller.css("height", (this.response.rowsAffected * this.rowHeight) + this.headerHeight + "px");
        console.log(this.start, this.end);
        this.scrollTable();
    }

    addHeader() {
        let i = 0;
        this.header = document.createElement("div").appendElementTo(this.table).addClass("th").dataAttr("row", 0) as Element;
        document.createElement("div").appendElementTo(this.header)
            .addClass("td")
            .addClass(`td${++i}`)
            .dataAttr("col", i)
            .on("mousemove", (e: MouseEvent)=>this.headerCellMousemove(e))
            .on("mouseenter", (e: MouseEvent)=>this.cellMouseEnter(e.currentTarget as Element))
            .on("mouseleave", (e: MouseEvent)=>this.cellMouseLeave(e.currentTarget as Element));
        if (this.response.header) {
            for(let item of this.response.header) {
                document
                    .createElement("div")
                    .html(`<div>${item.name}</div><div>${item.type}</div>`)
                    .appendElementTo(this.header)
                    .addClass("td")
                    .addClass(`td${++i}`)
                    .dataAttr("col", i)
                    .on("mousemove", (e: MouseEvent)=>this.headerCellMousemove(e))
                    .on("mouseenter", (e: MouseEvent)=>this.cellMouseEnter(e.currentTarget as Element))
                    .on("mouseleave", (e: MouseEvent)=>this.cellMouseLeave(e.currentTarget as Element));;
            }
        }
        this.headerHeight = this.header.clientHeight;
    }

    addRow(rn: number, row: Array<string>) {
        const e = this.newRow(rn, row).appendElementTo(this.table);
        this.rows.set(rn, e);
    }

    adjust() {
        this.onTableScroll();
        this.adjustGridScrollBars();
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
            .addClass(`td${++i}`)
            .dataAttr("col", i)
            .dataAttr("row", rn)
            .on("mouseenter", (e: MouseEvent)=>this.cellMouseEnter(e.currentTarget as Element))
            .on("mouseleave", (e: MouseEvent)=>this.cellMouseLeave(e.currentTarget as Element));
            
            if (this.rowWidths.length) {
                let w = this.rowWidths[i-1] + "px";
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
            
            if (this.rowWidths.length) {
                let w = this.rowWidths[i-1] + "px";
                td.css("min-width", w).css("max-width", w);
            }
        }
        return tr;
    }

    private adjustGridScrollBars() {
        if (!this.table) {
            return;
        }
        this.table.css("height", this.element.clientHeight + "px");
        if (this.scroller.clientHeight > this.table.clientHeight) {
            this.scroll.showElement();
            this.element.css("grid-template-columns", "auto 16px");
        } else {
            this.scroll.hideElement();
            this.element.css("grid-template-columns", "auto 0px");
        }

        if (this.header.clientWidth > this.element.clientWidth) {
            this.table.css("overflow-x", "scroll");
        } else {
            this.table.css("overflow-x", "hidden");
        }
    }

    private async onTableWheel(e: WheelEvent) {
        if (this.scroll == null) {
            return;
        }
        this.scroll.scrollTop = this.scroll.scrollTop + e.deltaY;
    }

    private onTableScroll() {
        if (!this.response) {
            return
        }
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout)
            this.scrollTimeout = undefined;
        }
        this.scrollTimeout = setTimeout(() => {
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout)
                this.scrollTimeout = undefined;
            }
            this.shouldScroll = true;
        }, 0);
    }

    private async startGridScrollConsumer() {
        setTimeout(async () => {
            if (this.shouldScroll) {
                this.shouldScroll = false;
                if (this.scrollStarted) {
                    return;
                }
                this.scrollStarted = true;
                await this.scrollTable();
                this.scrollStarted = false;
            }
            await this.startGridScrollConsumer();
        }, 0);
    }

    private async scrollTable() {
        if (this.scroll == null) {
            return {first: undefined, last: undefined}
        }
        let first = Math.trunc(this.scroll.scrollTop / this.rowHeight);
        let last = Math.trunc((this.scroll.scrollTop + this.scroll.offsetHeight) / this.rowHeight);
        
        if (first < 1) {
            first = 1;
        }
        if (last > this.response.rowsAffected) {
            last = this.response.rowsAffected;
        }

        if ((first >= this.end && last > this.end) || (first < this.start && last <= this.start)) { //load all
            this.rows.forEach(r => r.remove());
            this.rows.clear();
            this.start = first;
            this.end = last;
            await new Promise<void>(resolve => {
                cursor(this.response.connectionId, first, last, {
                    end: () => resolve(),
                    row: (rowNum, row: Array<string>) => {
                        const newRow = this.newRow(rowNum, row);
                        newRow.appendElementTo(this.table);
                        this.rows.set(rowNum, newRow);
                    }
                });
            });

        } else if (last > this.end && first >= this.start) { // load bottom
            await new Promise<void>(resolve => {
                cursor(this.response.connectionId, this.end + 1, last, {
                    end: () => resolve(),
                    row: (rowNum, row: Array<string>) => {
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

        } else if (last <= this.end && first < this.start) { //load top
            await new Promise<void>(resolve => {
                let last: Element;
                cursor(this.response.connectionId, first, this.start - 1, {
                    end: () => resolve(),
                    row: (rowNum, row: Array<string>) => {
                        let newRow = this.newRow(rowNum, row);
                        if (!last) {
                            this.header.after(newRow);
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

        } else if (first <= this.start && last >= this.end) { // load top and bottom

            if (first < this.start) { 
                await new Promise<void>(resolve => {
                    let last: Element;
                    cursor(this.response.connectionId, first, this.start - 1, {
                        end: () => resolve(),
                        row: (rowNum, row: Array<string>) => {
                            let newRow = this.newRow(rowNum, row);
                            if (!last) {
                                this.header.after(newRow);
                            } else {
                                last.after(newRow);
                            }
                            last = newRow;
                            if (rowNum < this.start) {
                                this.start = rowNum; 
                            }
                            this.rows.set(rowNum, newRow);
                        }
                    });
                });
            }

            if (last > this.end) {
                await new Promise<void>(resolve => {
                    cursor(this.response.connectionId, this.end + 1, last, {
                        end: () => resolve(),
                        row: (rowNum, row: Array<string>) => {
                            const newRow = this.newRow(rowNum, row);
                            newRow.appendElementTo(this.table);
                            if (rowNum > this.end) {
                                this.end = rowNum; 
                            }
                            this.rows.set(rowNum, newRow);
                        }
                    });
                });
            }

        }

        if (first + ((last - first) / 2) < this.response.rowsAffected / 2) {
            this.table.scrollTo({top: ((first - 1) * this.rowHeight) + (this.scroll.scrollTop % this.rowHeight), behavior: 'auto'});
        } else {
            this.table.scrollTo({top: (first * this.rowHeight) + (this.scroll.scrollTop % this.rowHeight), behavior: 'auto'})
        }
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
        if (this.rowWidths.length) {
            this.rowWidths[i-1] = wl;
        }
    }
}
