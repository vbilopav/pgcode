import { IRoutineInfo, IScriptInfo, ITableInfo } from "app/api";

export const routineTitle = (item: IRoutineInfo) => {
    let title = `Routine id ${item.id}\n`;
    title +=  `${item.name}\n`;
    title +=  `returns ${item.returns}\n`;
    title +=  `${item.language} ${item.type}`;
    if (item.comment) {
        title = title + `\n\n${item.comment.substring(0,200)}`;
    }
    return title;
}

export const scriptTitle = (item: IScriptInfo) => {
    let title = `Script id ${item.id}\n`;
    title +=  `${item.name}\n`;
    title +=  `modified: ${item.timestamp}`;
    if (item.comment) {
        title = title + `\n\n${item.comment.substring(0,200)}`;
    }
    return title;
}

export const tableTitle = (item: ITableInfo) => {
    let title = `Table id ${item.id}\n`;
    title +=  `${item.name}\n`;
    title +=  `estimated row count: ${item.estimate}`;
    if (item.comment) {
        title = title + `\n\n${item.comment.substring(0,200)}`;
    }
    return title;
}

export const viewTitle = (item: ITableInfo) => {
    let title = `View id ${item.id}\n`;
    title +=  `${item.name}\n`;
    title +=  `estimated row count: ${item.estimate}`;
    if (item.comment) {
        title = title + `\n\n${item.comment.substring(0,200)}`;
    }
    return title;
}