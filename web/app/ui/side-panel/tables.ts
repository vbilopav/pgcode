import { Keys } from "app/types";
import { ISchema, TableId, ITableInfo } from "app/api";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, Keys.TABLES, [
            {text: "Filter"},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
    }

    protected schemaChanged(data: ISchema) {
        this.items.html("");
        for(let item of data.tables) {
            this.addNewItem(item);
        }
        this.publishLength();
    }

    private addNewItem(item: ITableInfo) {
        let title = `${item.name}\nestimated row count: ${item.estimate}`;
        if (item.comment) {
            title = title + `\n\n${item.comment.substring(0,200)}`;
        }
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
        .attr("title", title)
        .attr("id", TableId(item.id))
        .appendElementTo(this.items);
    }
    
    protected itemSelected(element: Element) {
        const item = element.dataAttr("item") as ITableInfo;
        this.mainPanel.activate(TableId(item.id), item.name, Keys.TABLES, "icon-database");
    };
}