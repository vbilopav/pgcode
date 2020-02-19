import { keys } from "app/types";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, keys.search.toUpperCase());
        
    }
}