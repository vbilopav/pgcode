import { Keys } from "app/types";
import { ISchema } from "app/api";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, Keys.SEARCH);
        
    }

    protected schemaChanged(data: ISchema) { }
}