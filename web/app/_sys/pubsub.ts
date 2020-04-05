const _entries: Record<string, Array<(...args: any[]) => void>> = {};
const _hashes: Record<number, boolean> = {};

export const subscribe: (
    name: string | Array<string>, 
    handler: (...args: any[]) => void,
    skipDups?: boolean) => number | void = (name, handler, skipDups) => {
    const doSub: (topic: string) => number = topic => {
        let entry = _entries[topic];
        if (!entry) {
            entry = _entries[topic] = [];
        } 
        const hash = (topic + handler).hashCode();
        if (!skipDups) {
            _hashes[hash] = true;
            _entries[topic].push(handler);
        } else {
            if (!_hashes[hash]) {
                _hashes[hash] = true;
                return _entries[topic].push(handler) - 1;
            }
        }
        return hash;
    };
    if (name instanceof Array) {
        for(let n of name) {
            doSub(n);
        }
    } else {
        return doSub(name);
    }
};

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
};

export const unsubscribe: (name: string, ref: number) => boolean = (name, ref) => {
    let entry = _entries[name];
    if (!entry) {
        return false;
    }
    entry.splice(ref, 1);
    return true;
};

//Keys { SCRIPTS = "scripts", TABLES = "tables", VIEWS = "views", ROUTINES = "routines", SEARCH = "search" };
export const STATE_CHANGED_ON: string = "state/changed/on/"; // key: string
export const STATE_CHANGED_OFF: string = "state/changed/off/"; // key: string
export const STATE_CHANGED: string = "state/changed/"; // helper, key: string, state: bool

export const STATE_CHANGED_SCRIPTS: string = `state/changed/scripts`; // key: string, state: bool
export const STATE_CHANGED_TABLES: string = `state/changed/tables`; // key: string, state: bool
export const STATE_CHANGED_VIEWS: string = `state/changed/views`; // key: string, state: bool
export const STATE_CHANGED_ROUTINES: string = `state/changed/routines`; // key: string, state: bool
export const STATE_CHANGED_SEARCH: string = `state/changed/search`; // key: string, state: bool

export const SIDEBAR_DOCKED: string = "sidebar/docked/"; //void
export const SIDEBAR_UNDOCKED: string = "sidebar/undocked/"; //void
export const CLOSE_CONTEXT_MENU: string = "context-menu/close/"; //id
export const SET_APP_STATUS: string = "app/status/"; //status: AppStatus, text?: string

export const API_INITIAL: string = "api/initial/"; //initial: IInitial
export const SCHEMA_CHANGED: string = "app/schema/"; //schema: ISchema, name: string
export const ITEM_COUNT_CHANGED: string = "item/count/"; //key: string, count: number

export const SPLITTER_CHANGED: string = "splitter/changed"; //void

export const TAB_SELECTED = `tab/selected`; //id: string, key: string, schema: string, connection: string 
export const TAB_UNSELECTED = `tab/unselected`; //id: string, key: string
