import { ItemInfoType, IRoutineInfo, IScriptInfo, ITableInfo, Keys } from "app/api";
import { scriptTitle, tableTitle, viewTitle, routineTitle } from "app/ui/item-tooltip";

const createTabElement: (id: string, key: Keys, data: ItemInfoType) => Element = (id, key, data) => {
    let iconClass : string;
    let title = data.name;
    let tip: string;
    let tabId: string;
    if (key === Keys.SCRIPTS) {
        iconClass = "icon-doc-text";
        tip = scriptTitle(data as IScriptInfo);
        tabId = (new Date().getTime()).toString(36);
        console.log("script tab created", tabId);
        
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
        .attr("title", tip)
        .dataAttr("tabId", tabId)
};

export default createTabElement;