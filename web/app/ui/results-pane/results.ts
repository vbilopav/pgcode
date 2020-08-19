import { IHeader } from "app/api";
import { timeout } from "app/_sys/timeout";

export default class  {
    private readonly element: Element;
    private readonly id: string;
    private table: Element;
    private last: Element;
    private first: Element;
    private headerHeight: number;

    private toMove: Element;
    private moving = false;

    constructor(id: string, element: Element) {
        this.id = id;
        this.element = element;
        this.table = null;
    }

    initGrid() {
        this.element.html("");
        this.table = document.createElement("div").appendElementTo(this.element).addClass("table").on("scroll", e => this.onTableScroll())
        this.last = null;
        this.first = null;
        window
            .on("mousedown", (e:MouseEvent)=>this.mousedown(e))
            .on("mouseup", (e:MouseEvent)=>this.mouseup(e))
            .on("mousemove", (e:MouseEvent)=>this.mousemove(e))
            .on("resize", () => this.adjustGrid());
    }

    addHeader(header: IHeader[]) {
        const th = document.createElement("div").appendElementTo(this.table).addClass("th").dataAttr("rn", 0) as Element;
        document.createElement("div").appendElementTo(th).addClass("td");
        let i = 1;
        for(let item of header) {
            document
                .createElement("div")
                .html(`<div>${item.name}</div><div>${item.type}</div>`)
                .appendElementTo(th)
                .addClass("td")
                .dataAttr("i", i++)
                .on("mousemove", (e: MouseEvent)=>this.cellMousemove(e));
        }
        this.headerHeight = th.clientHeight;
    }

    addRow(rn: number, row: Array<string>) {
        const tr = document.createElement("div").appendElementTo(this.table).addClass("tr").dataAttr("rn", rn);
        if (!this.first) {
            this.first = tr;
        }
        this.last = tr;
        document.createElement("div").html(`${rn}`).appendElementTo(tr).addClass("td").addClass("th");
        let i = 1;
        for(let item of row) {
            let td = document
                .createElement("div")
                .html(`${(item == null? "NULL" : item)}`)
                .appendElementTo(tr)
                .addClass("td")
                .addClass(`td${i++}`);
            if (item == null) {
                td.addClass("null");
            }
        }
    }

    adjustGrid() {
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
        timeout(() => {
            const rect = this.table.getBoundingClientRect() as DOMRect;
            const first = document.elementFromPoint(rect.x, rect.y + this.headerHeight).parentElement;
            const last = document.elementFromPoint(rect.x, rect.y + this.table.clientHeight - 5).parentElement;
            
            console.log(first.dataAttr("rn"), last.dataAttr("rn"));
        }, 75, `${this.id}-grid-scroll`);
    }

    private cellMousemove(e: MouseEvent) {
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

    private mousedown(e: MouseEvent) {
        if (this.toMove) {
            this.moving = true;
            document.body.css("cursor", "col-resize");

            this.toMove.css("border-right-style", "dotted");
            if (this.toMove.nextElementSibling) {
                this.toMove.nextElementSibling.css("border-left-style", "dotted");
            }
            this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("i")}`).css("border-right-style", "dotted");
            this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("i")+1}`).css("border-left-style", "dotted");
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
        this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("i")}`).css("border-right-style", "");
        this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("i")+1}`).css("border-left-style", "");
        this.toMove = null;
    }

    private mousemove(e: MouseEvent) {
        if (!this.moving) {
            if (!(e.target as Element).hasClass("th") && !(e.target as Element).parentElement.hasClass("th") && !(e.target as Element).parentElement.parentElement.hasClass("th")) {
                document.body.css("cursor", "default");
            }
            return;
        }
        const rect = this.toMove.getBoundingClientRect() as DOMRect;
        const w = (e.clientX - rect.x - 11) + "px";
        this.toMove.css("min-width", w).css("max-width", w);
        this.table.findAll(`div.tr > div.td${this.toMove.dataAttr("i")}`).css("min-width", w).css("max-width", w);
    }

}
