import { Keys } from "app/types";
import { ISchema, IRoutineInfo } from "app/api";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, Keys.ROUTINES, [
            {text: "Filter"},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
    }

    protected schemaChanged(data: ISchema) {
        this.items.html("");
        for(let item of data.routines) {
            this.addNewItem(item);
        }
        this.publishLength();
    }

    private addNewItem(item: IRoutineInfo) {
        this.createItemElement(String.html`
            <i class="icon-database"></i>
            <span>${item.name}</span>
        `)
        .dataAttr("item", item)
        .appendElementTo(this.items);
    }
}