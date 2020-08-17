import { timeout } from "app/_sys/timeout";
import { IHeader } from "app/api";

export default class  {
    private readonly element: Element;
    private table: Element;
    private last: Element;
    private first: Element;

    constructor(element: Element) {
        this.element = element;
        this.table = null;
    }

    initGrid() {
        this.element.html("");
        this.table = document.createElement("div").appendElementTo(this.element).addClass("table");
        this.last = null;
        this.first = null;
    }

    addHeader(header: IHeader[]) {
        const th = document.createElement("div").appendElementTo(this.table).addClass("th");
        document.createElement("div").appendElementTo(th).addClass("td");
        for(let item of header) {
            document
                .createElement("div")
                .html(`<div>${item.name}</div><div>${item.type}</div>`)
                .appendElementTo(th)
                .addClass("td")
                .on("mousemove", (e: MouseEvent)=>this.cellHover(e));
        }
    }

    addRow(rn: number, row: Array<string>) {
        const tr = document.createElement("div").appendElementTo(this.table).addClass("tr");
        if (!this.first) {
            this.first = tr;
        }
        this.last = tr;
        document.createElement("div").html(`${rn}`).appendElementTo(tr).addClass("td").addClass("th");;
        for(let item of row) {
            let td = document
                .createElement("div")
                .html(`${(item == null? "NULL" : item)}`)
                .appendElementTo(tr)
                .addClass("td");
            if (item == null) {
                td.addClass("null");
            }
        }
        this.adjustGrid();
    }

    adjustGrid() {
        if (!this.table) {
            return;
        }
        const rect = this.element.parentElement.getBoundingClientRect() as DOMRect;
        this.table.css("height", rect.height + "px");
        const last = this.last.getBoundingClientRect() as DOMRect;
        const first = this.last.getBoundingClientRect() as DOMRect;
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

    private cellHover(e: any) {
        const cell = e.currentTarget;
        const rect = cell.getBoundingClientRect();
        if (e.offsetX < 4) {
            cell.css("cursor", "col-resize");
        } else if (e.offsetX > rect.width - 4) {
            cell.css("cursor", "col-resize");
        } else {
            cell.css("cursor", "default");
        }
    }
}
