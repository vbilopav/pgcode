import { Keys } from "app/types";
import { ISchema, IRoutineInfo, RoutineId } from "app/api";
import Panel from "app/ui/side-panel/panel"

export default class extends Panel {
    constructor(element: Element) {
        super(element, Keys.ROUTINES, [
            {text: "Filter"},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
    }

    protected schemaChanged(data: ISchema) {
        this.items.html("");
        for(let item of data.routines) {
            this.addNewItem(item);
        }
        this.publishLength();
    }

    private addNewItem(item: IRoutineInfo) {
        let title = `${item.signature}\nreturns ${item.returns}\n${item.language} ${item.type}`;
        if (item.comment) {
            title = title + `\n\n${item.comment.substring(0,200)}`;
        }
        this.createItemElement(String.html`
            <div>
                <i class="icon-database"></i>
                <span>${item.signature}</span>
            </div>
            <div>
                <div class="item-subtext">returns ${item.returns}</div>
                <div class="item-subtext">${item.language} ${item.type}</div>
            </div>
        `)
        .dataAttr("item", item)
        .attr("title", title)
        .attr("id", RoutineId(item.id))
        .appendElementTo(this.items);
    }

    protected itemSelected(element: Element) {
        const item = element.dataAttr("item") as IRoutineInfo;
        this.mainPanel.activate(RoutineId(item.id), item.signature, Keys.ROUTINES, "icon-database");
    };
}