import {ISchema, TableId, ITableInfo, Keys, ItemContentArgs} from "app/api";
import Panel from "app/ui/side-panel/panel";
import { tableTitle } from "app/ui/item-tooltip";

abstract class TablePanel extends Panel {
    constructor(element: Element, keyName: string) {
        super(element, keyName as Keys, [
            {text: "Filter"},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
    }

    protected schemaChanged(data: ISchema, schema: string) {
        this.items.html("");
        for(let item of data[this.key]) {
            this.addNewItem({schema: schema, connection: data.connection, ...item} as ITableInfo);
        }
        this.publishLength();
    }

    private addNewItem(item: ITableInfo) {
        const comment = item.comment ? String.html`<div class="item-comment">${item.comment.replace("\n", "")}</div>` : "";
        this.createItemElement(String.html`
            <div>
                <i class="icon-database"></i>
                <span>${item.name}</span>
            </div>
            <div>
                <div class="item-subtext">count ≈ ${item.estimate}</div>
                ${comment}
            </div>
        `)
        .dataAttr("item", item)
        .attr("title", tableTitle(item))
        .attr("id", TableId(item.id))
        .appendElementTo(this.items);
    }
    
    protected itemSelected(element: Element, contentArgs = ItemContentArgs) {
        const item = element.dataAttr("item") as ITableInfo;
        this.mainPanel.activate(TableId(item.id), this.key, item);
    };
}

export class Tables extends TablePanel {
    constructor(element: Element) {
        super(element, Keys.TABLES)
    }
}

export class Views extends TablePanel { 
    constructor(element: Element) {
        super(element, Keys.VIEWS)
    }
}