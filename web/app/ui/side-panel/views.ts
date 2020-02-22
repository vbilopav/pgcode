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
            String.html`
            <div>
                <i class="icon-database"></i>
                <span>${item}</span>
            </div>
            `.toElement().appendElementTo(this.items);
        }
        this.publishLength();
    }
}