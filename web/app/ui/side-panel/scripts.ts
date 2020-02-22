import { keys } from "app/types";
import { ISchema, IScriptInfo, createScript } from "app/api";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, keys.scripts, [
            {text: "New script", keyBindingsInfo: "Ctrl+N", action: () => this.createScript()},
            {splitter: true},
            {text: "Filter"},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
    }

    protected schemaChanged(data: ISchema) {
        this.items.html("");
        for(let item of data.scripts) {
            this.addNewItem(item);
        }
        this.publishLength();
    }

    private async createScript() {
        const response = await createScript();
        if (response.ok) {
            this.addNewItem(response.data);
            this.publishLength();
        }
    }

    private addNewItem(item: IScriptInfo) {
        String.html`
        <div data-id="${item.id}">
            <i class="icon-doc-text"></i>
            <span>${item.title}<span>
        </div>`
        .toElement()
        .appendElementTo(this.items);
    }
}