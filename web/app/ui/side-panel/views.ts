import { keys } from "app/types";
import { ISchema } from "app/api";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, keys.views, [
            {text: "Filter"},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
    }

    protected schemaChanged(data: ISchema) {
        this.items.html("");
        for(let item of data.views) {
            this.addNewItem(item);
        }
        this.publishLength();
    }

    private addNewItem(item: string) {
        this.createItemElement(String.html`
            <i class="icon-database"></i>
            <span>${item}</span>
        `)
        .dataAttr("item", item)
        .appendElementTo(this.items);
    }
}