import { 
    ItemInfoType, 
    IRoutineInfo, 
    IScriptInfo, 
    ITableInfo, 
    Keys,
    ScriptId
} from "app/api";
import { scriptTitle, tableTitle, viewTitle, routineTitle } from "app/ui/item-tooltip";
import { Item } from "app/ui/main-panel/main-panel";

export const createTabElement: (id: string, key: Keys, data: ItemInfoType) => Element = (id, key, data) => {
    let iconClass : string;
    let title = data.name;
    let tip: string;
    if (key === Keys.SCRIPTS) {
        iconClass = "icon-doc-text";
        tip = scriptTitle(data as IScriptInfo);
    } else if (key === Keys.TABLES) {
        iconClass = "icon-database";
        tip = tableTitle(data as ITableInfo);

    } else if (key === Keys.VIEWS) {
        iconClass = "icon-database";
        tip = viewTitle(data as ITableInfo);

    } else if (key === Keys.ROUTINES) {
        iconClass = "icon-database";
        tip = routineTitle(data as IRoutineInfo);
    }

    return (String.html`
        <div class="tab" draggable="true">
            <i class=${iconClass}></i>
            <span class="title">${title}</span>
            <i class="close" title="close">&#10006</i>
        </div>` as string)
        .toElement()
        .attr("id", id)
        .attr("title", tip);
};

export const updateScriptTabElement: (items: Map<string, Item>, data: IScriptInfo) => void = (items, data) => {
    const item = items.get(ScriptId(data.id))
    if (!item) {
        return
    }
    item.tab.attr("title", scriptTitle(data));
}