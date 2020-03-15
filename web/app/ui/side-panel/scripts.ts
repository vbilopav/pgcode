import { ISchema, IScriptInfo, createScript, ScriptId, Keys } from "app/api";
import Panel from "app/ui/side-panel/panel";
import { scriptTitle } from "app/ui/item-tooltip";

export default class extends Panel {
    constructor(element: Element) {
        super(element, Keys.SCRIPTS, [
            {text: "New script", keyBindingsInfo: "Ctrl+N", action: () => this.createScript()},
            {splitter: true},
            {text: "Filter"},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
    }

    protected schemaChanged(data: ISchema, schema: string) {
        this.items.html("");
        for(let item of data.scripts) {
            this.addNewItem({schema: schema, connection: data.connection, ...item} as IScriptInfo);
        }
        this.publishLength();
    }

    private async createScript() {

        const response = await createScript();
        if (response.ok) {
            this.addNewItem(response.data as IScriptInfo);
            this.publishLength();
            //this.mainPanel activate with content
        }
        
    }

    private addNewItem(item: IScriptInfo) {
        const comment = item.comment ? String.html`<div class="item-comment">${item.comment.replace("\n", "")}</div>` : "";
        this.createItemElement(String.html`
            <div>
                <i class="icon-doc-text"></i>
                <span>${item.name}</span>
            </div>
            <div>
                <div class="item-subtext">${item.timestamp.formatDateString()}</div>
                ${comment}
            </div>
        `)
        .dataAttr("item", item)
        .attr("title", scriptTitle(item))
        .attr("id", ScriptId(item.id))
        .appendElementTo(this.items);
    }

    protected itemSelected(element: Element) {
        const item = element.dataAttr("item") as IScriptInfo;
        this.mainPanel.activate(ScriptId(item.id), Keys.SCRIPTS, item);
    };
}