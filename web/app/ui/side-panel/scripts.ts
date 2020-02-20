import { subscribe, publish, WS_CHANGED, ITEM_COUNT_CHANGED } from "app/_sys/pubsub";
import { IWorkspace, keys } from "app/types";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, keys.scripts.toUpperCase(), [
            {text: "New scripts"},
            {splitter: true},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
        
        subscribe(WS_CHANGED, (data: IWorkspace) => {
            publish(ITEM_COUNT_CHANGED, keys.scripts, data.scripts.length);
            this.items.html("");
            for(let item of data.scripts) {
                String.html`<div data-id="${item.id}">${item.title}</div>`
                    .toElement()
                    .appendElementTo(this.items);
            }
        });
    }
}