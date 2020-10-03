import { INotice, IExecuteResponse } from "app/api";

export default class  {
    private readonly element: Element;

    constructor(element: Element) {
        this.element = element;
    }

    clear() {
        this.element.html("");
    }

    message(e: INotice) {
        document.createElement("code").html(JSON.stringify(e)).appendElementTo(this.element);
    }

    finished(e: IExecuteResponse) {
        document.createElement("code").html(JSON.stringify(e)).appendElementTo(this.element);
    }
}
