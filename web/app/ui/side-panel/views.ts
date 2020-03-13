import { ISchema, ViewId, ITableInfo, Keys } from "app/api";
import Panel from "app/ui/side-panel/panel";
import { viewTitle } from "app/ui/item-tooltip";

export default class extends Panel {
    constructor(element: Element) {
        super(element, Keys.VIEWS, [
            {text: "Filter"},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
    }

    protected schemaChanged(data: ISchema, schema: string) {
        this.items.html("");
        for(let item of data.views) {
            this.addNewItem(item);
        }
        this.publishLength();
    }

    private addNewItem(item: ITableInfo) {
        this.createItemElement(String.html`
            <div>
                <i class="icon-database"></i>
                <span>${item.name}</span>
            </div>
            <div>
                <div class="item-subtext">count=${item.estimate}</div>
            </div>
        `)
        .dataAttr("item", item)
        .attr("title", viewTitle(item))
        .attr("id", ViewId(item.id))
        .appendElementTo(this.items);
    }

    protected itemSelected(element: Element) {
        const item = element.dataAttr("item") as ITableInfo;
        this.mainPanel.activate(ViewId(item.id), Keys.VIEWS, item);
    };
}