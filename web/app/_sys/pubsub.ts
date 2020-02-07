import { keys } from "app/types";

const _entries = {};

const subscribe: (name: string | Array<string>, handler: (...args: any[]) => void) => number | void = (name, handler) => {
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

const publish: (name: string | Array<string>, ...args: any[]) => void = (name, ...args) => {
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

const unsubscribe: (name: string, ref: number) => boolean = (name, ref) => {
    let entry = _entries[name];
    if (!entry) {
        return false;;
    }
    entry.splice(ref, 1);
    return true;
}

const STATE_CHANGED_ON: string = "state/changed/on/"; // id: string
const STATE_CHANGED_OFF: string = "state/changed/off/"; // id: string
const STATE_CHANGED: string = "state/changed/"; // helper, id: string, state: bool

const STATE_CHANGED_SCRIPTS: string = `state/changed/${keys.scripts}`; // id: string, state: bool
const STATE_CHANGED_TABLES: string = `state/changed/${keys.tables}`; // id: string, state: bool
const STATE_CHANGED_VIEWS: string = `state/changed/${keys.views}`; // id: string, state: bool
const STATE_CHANGED_ROUTINES: string = `state/changed/${keys.routines}`; // id: string, state: bool
const STATE_CHANGED_SEARCH: string = `state/changed/${keys.search}`; // id: string, state: bool

const SIDEBAR_DOCKED: string = "sidebar/docked/"; //void
const SIDEBAR_UNDOCKED: string = "sidebar/undocked/"; //void
const CLOSE_CONTEXT_MENU: string = "context-menu/close/"; //id
const SET_APP_STATUS: string = "app/status/"; //status: AppStatus, text?: string

const API_INITIAL: string = "api/initial/"; //initial: IInitial
const WS_CHANGED: string = "app/schema/"; //schema: IWorkspace
const ITEM_COUNT_CHANGED: string = "item/count/"; //id: string, count: number

export { 
    subscribe, publish, unsubscribe,

    STATE_CHANGED_ON,
    STATE_CHANGED_OFF,
    STATE_CHANGED,
    STATE_CHANGED_SCRIPTS,
    STATE_CHANGED_TABLES,
    STATE_CHANGED_VIEWS,
    STATE_CHANGED_ROUTINES,
    STATE_CHANGED_SEARCH,
    SIDEBAR_DOCKED,
    SIDEBAR_UNDOCKED,
    CLOSE_CONTEXT_MENU,
    SET_APP_STATUS,
    API_INITIAL,
    WS_CHANGED,
    ITEM_COUNT_CHANGED
};