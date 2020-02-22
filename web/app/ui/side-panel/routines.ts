import { subscribe, publish, WS_CHANGED, ITEM_COUNT_CHANGED } from "app/_sys/pubsub";
import { ISchema, keys } from "app/types";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, keys.routines.toUpperCase());

        subscribe(WS_CHANGED, (data: ISchema) => {
            publish(ITEM_COUNT_CHANGED, keys.routines, data.routines.length);
            this.items.html("");
            for(let item of data.routines) {
                String.html`<div>${item.name}</div>`.toElement().appendElementTo(this.items);
            }
        });
    }
}