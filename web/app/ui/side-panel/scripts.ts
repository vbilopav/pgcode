import { subscribe, publish, WS_CHANGED, ITEM_COUNT_CHANGED } from "app/_sys/pubsub";
import { IWorkspace, keys } from "app/types";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, keys.scripts.toUpperCase());
        
        subscribe(WS_CHANGED, (data: IWorkspace) => {
            //console.log(data.scripts);
            publish(ITEM_COUNT_CHANGED, keys.scripts, data.scripts.length);
        });
    }
}