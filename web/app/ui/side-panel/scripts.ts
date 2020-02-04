import { subscribe, WS_CHANGED } from "app/_sys/pubsub";
import { IWorkspace, IPanel } from "app/types";

export default class implements IPanel {
    private element: Element;

    constructor(element: Element){
        this.element = element;
        subscribe(WS_CHANGED, (data: IWorkspace) => {
            console.log(data.scripts);
        });
    }

    show(state: boolean) {
        this.element.showElement(state);
    }
}