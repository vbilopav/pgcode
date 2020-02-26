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
            //this.mainPanel
        }
    }

    private addNewItem(item: IScriptInfo) {
        const comment = item.comment ? String.html`<div class="item-subtext">${item.comment}</div>` : "";
        let title = `id: ${item.id}\ntitle: ${item.title}\nmodified: ${item.timestamp}`;
        if (item.comment) {
            title = `title\ncomment: ${item.comment}`;
        }
        this.createItemElement(String.html`
            <div>
                <i class="icon-doc-text"></i>
                <span>${item.title}</span>
            </div>
            <div>
                <div class="item-subtext">${item.timestamp.formatDateString()}</div>
                ${comment}
            </div>
        `)
        .dataAttr("item", item)
        .attr("title", title)
        .appendElementTo(this.items);
    }
}