import { IWorkspace, IPanel } from "app/types";

export default class implements IPanel {
    private element: Element;

    constructor(element: Element){
        this.element = element;
    }

    show(state: boolean) {
        this.element.showElement(state);
    }
}