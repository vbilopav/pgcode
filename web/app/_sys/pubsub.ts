import { keys } from "app/types";

const _entries = {};

export const subscribe: (name: string | Array<string>, handler: (...args: any[]) => void) => number | void = (name, handler) => {
    const doSub: (topic: string) => number = topic => {
        let entry = _entries[topic];
        if (!entry) {
            entry = _entries[topic] = [];
        } 
        return _entries[topic].push(handler) - 1;
    };
    if (name instanceof Array) {
        for(let n of name) {
            doSub(n);
        }
    } else {
        return doSub(name);
    }
}

export const publish: (name: string | Array<string>, ...args: any[]) => void = (name, ...args) => {
    const doPub: (topic: string) => void = topic => {
        const entry = _entries[topic];
        if (!entry) {
            return;
        }
        for(let callback of entry) {
            callback(...args);
        }
    };
    if (name instanceof Array) {
        for(let n of name) {
            doPub(n);
        }
    } else {
        doPub(name);
    }
}

export const unsubscribe: (name: string, ref: number) => boolean = (name, ref) => {
    let entry = _entries[name];
    if (!entry) {
        return false;;
    }
    entry.splice(ref, 1);
    return true;
}

export const STATE_CHANGED_ON: string = "state/changed/on/"; // id: string
export const STATE_CHANGED_OFF: string = "state/changed/off/"; // id: string
export const STATE_CHANGED: string = "state/changed/"; // helper, id: string, state: bool

export const STATE_CHANGED_SCRIPTS: string = `state/changed/${keys.scripts}`; // id: string, state: bool
export const STATE_CHANGED_TABLES: string = `state/changed/${keys.tables}`; // id: string, state: bool
export const STATE_CHANGED_VIEWS: string = `state/changed/${keys.views}`; // id: string, state: bool
export const STATE_CHANGED_ROUTINES: string = `state/changed/${keys.routines}`; // id: string, state: bool
export const STATE_CHANGED_SEARCH: string = `state/changed/${keys.search}`; // id: string, state: bool

export const SIDEBAR_DOCKED: string = "sidebar/docked/"; //void
export const SIDEBAR_UNDOCKED: string = "sidebar/undocked/"; //void
export const CLOSE_CONTEXT_MENU: string = "context-menu/close/"; //id
export const SET_APP_STATUS: string = "app/status/"; //status: AppStatus, text?: string

export const API_INITIAL: string = "api/initial/"; //initial: IInitial
export const SCHEMA_CHANGED: string = "app/schema/"; //schema: ISchema
export const ITEM_COUNT_CHANGED: string = "item/count/"; //id: string, count: number

export const SPLITTER_CHANGED: string = "splitter/changed"; //void
