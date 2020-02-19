import { subscribe, publish, WS_CHANGED, ITEM_COUNT_CHANGED } from "app/_sys/pubsub";
import { IWorkspace, keys } from "app/types";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, keys.tables.toUpperCase());
        
        subscribe(WS_CHANGED, (data: IWorkspace) => {
            publish(ITEM_COUNT_CHANGED, keys.tables, data.tables.length);
            this.items.html("");
            for(let item of data.tables) {
                String.html`<div>${item}</div>`.toElement().appendElementTo(this.items);
            }
        });
    }
}