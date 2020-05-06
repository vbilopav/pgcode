import {ISchema, IRoutineInfo, RoutineId, Keys} from "app/api";
import Panel from "app/ui/side-panel/panel";
import { routineTitle } from "app/ui/item-tooltip";

export default class extends Panel {
    constructor(element: Element) {
        super(element, Keys.ROUTINES, [
            {text: "Filter"},
            {text: "Order ascending"},
            {text: "Order descending"},
        ]);
    }

    protected schemaChanged(data: ISchema, schema: string) {
        this.items.html("");
        for(let item of data.routines) {
            this.addNewItem({schema: schema, connection: data.connection, ...item} as IRoutineInfo);
        }
        this.publishLength();
    }

    private addNewItem(item: IRoutineInfo) {
        const comment = item.comment ? String.html`<div class="item-comment">${item.comment.replace("\n", "")}</div>` : "";
        this.createItemElement(String.html`
            <div>
                <i class="icon-database"></i>
                <span>${item.name}</span>
            </div>
            <div>
                <div class="item-subtext">${item.language} ${item.type} returns ${item.returns}</div>
                ${comment}
            </div>
        `)
        .dataAttr("item", item)
        .attr("title", routineTitle(item))
        .attr("id", RoutineId(item))
        .appendElementTo(this.items);
    }

    protected itemSelected(element: Element, contentArgs) {
        const item = element.dataAttr("item") as IRoutineInfo;
        this.mainPanel.activate(RoutineId(item), Keys.ROUTINES, item, contentArgs);
    };
}