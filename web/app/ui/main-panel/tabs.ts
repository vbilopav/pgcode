import { Keys } from "app/types";
import { IRoutineInfo, IScriptInfo, ITableInfo } from "app/api";

export const createTabElement: (id: string, key: Keys, data: IRoutineInfo | IScriptInfo | ITableInfo) => Element = (id, key, data) => {
    let iconClass : string;
    let title : string;
    if (key === Keys.SCRIPTS) {
        iconClass = "icon-doc-text";
        title = (data as IScriptInfo).title;

    } else if (key === Keys.TABLES) {
        iconClass = "icon-database";
        title = (data as ITableInfo).name;

    } else if (key === Keys.VIEWS) {
        iconClass = "icon-database";
        title = (data as ITableInfo).name;

    } else if (key === Keys.ROUTINES) {
        iconClass = "icon-database";
        title = (data as IRoutineInfo).signature;

    }
    return (String.html`
    <div class="tab">
        <i class=${iconClass}></i>
        <span class="title">${title}</span>
        <i class="close" title="close">&#10006</i>
    </div>` as string)
    .toElement()
    .dataAttr("data", data)
    .attr("id", id)
    .attr("title", `${data.id} - ${title}\n\nSchema: ${data.schema}\nConnection: ${data.connection}\nComment: ${!data.comment ? "" : data.comment}`)
}