import { IItem, IRoutineInfo, IScriptInfo, ITableInfo } from "app/api";

const getTitle = (title: string, sub: string, item: IItem) =>
    `${title}\n` +
    `connection: ${item.connection}\n` +
    `schema: ${item.schema}` +
    (sub ? "\n" + sub : "") +
    (item.comment ? `\n\n${item.comment}` : "");


export const routineTitle = (item: IRoutineInfo) => getTitle(`${item.language.toLowerCase()} ${item.type.toLowerCase()} ${item.name} returns ${item.returns}`, null, item);
export const scriptTitle = (item: IScriptInfo) => getTitle(`script: ${item.name}`, `modified: ${item.timestamp.formatDateString()}`, item);
export const tableTitle = (item: ITableInfo) => getTitle(`table: ${item.name}`, `estimated count ≈ ${item.estimate}`, item);
export const viewTitle = (item: ITableInfo) => getTitle(`view: ${item.name}`, `estimated count ≈ ${item.estimate}`, item);