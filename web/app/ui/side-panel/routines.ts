import { subscribe, publish, WS_CHANGED, ITEM_COUNT_CHANGED } from "app/_sys/pubsub";
import { IWorkspace, IPanel, keys } from "app/types";

export default class implements IPanel {
    private element: Element;

    constructor(element: Element){
        this.element = element;
        subscribe(WS_CHANGED, (data: IWorkspace) => {
            //console.log(data.routines);
            publish(ITEM_COUNT_CHANGED, keys.routines, data.routines.length);
        });
    }

    show(state: boolean) {
        this.element.showElement(state);
    }
}