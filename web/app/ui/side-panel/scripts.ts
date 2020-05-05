import { 
    ISchema, IScriptInfo, IScriptContent, createScript, ScriptId, Keys 
} from "app/api";
import Panel from "app/ui/side-panel/panel";
import { scriptTitle } from "app/ui/item-tooltip";
import {SCRIPT_UPDATED, subscribe} from "app/_sys/pubsub";

export default class extends Panel {
    constructor(element: Element) {
        super(element, Keys.SCRIPTS, [
            {text: "New script", keyBindingsInfo: "Ctrl+N", action: () => this.createScript()},
            {splitter: true},
            {text: "Filter"},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
        subscribe(SCRIPT_UPDATED, (data: IScriptInfo) => 
            this.items.find(`#${ScriptId(data.id)}`).find(".item-subtext").html(data.timestamp.formatDateString()));
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
            this.sidePanel.unselectAll();
            this.selectItemByElement(this.addNewItem(response.data as IScriptInfo), true, {content: response.data as IScriptContent, sticky: false});
            this.publishLength();
        }
        
    }

    private addNewItem(item: IScriptInfo) {
        const comment = item.comment ? String.html`<div class="item-comment">${item.comment.replace("\n", "")}</div>` : "";
        return this.createItemElement(String.html`
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
        .appendElementTo(this.items) as Element; 
    }

    protected itemSelected(element: Element, contentArgs) {
        const item = element.dataAttr("item") as IScriptInfo;
        this.mainPanel.activate(ScriptId(item.id), Keys.SCRIPTS, item, contentArgs);
    };
}