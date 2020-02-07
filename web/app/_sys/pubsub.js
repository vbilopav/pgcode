define(["require", "exports", "app/types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _entries = {};
    const subscribe = (name, handler) => {
        const doSub = topic => {
            let entry = _entries[topic];
            if (!entry) {
                entry = _entries[topic] = [];
            }
            return _entries[topic].push(handler) - 1;
        };
        if (name instanceof Array) {
            for (let n of name) {
                doSub(n);
            }
        }
        else {
            return doSub(name);
        }
    };
    exports.subscribe = subscribe;
    const publish = (name, ...args) => {
        const doPub = topic => {
            const entry = _entries[topic];
            if (!entry) {
                return;
            }
            for (let callback of entry) {
                callback(...args);
            }
        };
        if (name instanceof Array) {
            for (let n of name) {
                doPub(n);
            }
        }
        else {
            doPub(name);
        }
    };
    exports.publish = publish;
    const unsubscribe = (name, ref) => {
        let entry = _entries[name];
        if (!entry) {
            return false;
            ;
        }
        entry.splice(ref, 1);
        return true;
    };
    exports.unsubscribe = unsubscribe;
    const STATE_CHANGED_ON = "state/changed/on/";
    exports.STATE_CHANGED_ON = STATE_CHANGED_ON;
    const STATE_CHANGED_OFF = "state/changed/off/";
    exports.STATE_CHANGED_OFF = STATE_CHANGED_OFF;
    const STATE_CHANGED = "state/changed/";
    exports.STATE_CHANGED = STATE_CHANGED;
    const STATE_CHANGED_SCRIPTS = `state/changed/${types_1.keys.scripts}`;
    exports.STATE_CHANGED_SCRIPTS = STATE_CHANGED_SCRIPTS;
    const STATE_CHANGED_TABLES = `state/changed/${types_1.keys.tables}`;
    exports.STATE_CHANGED_TABLES = STATE_CHANGED_TABLES;
    const STATE_CHANGED_VIEWS = `state/changed/${types_1.keys.views}`;
    exports.STATE_CHANGED_VIEWS = STATE_CHANGED_VIEWS;
    const STATE_CHANGED_ROUTINES = `state/changed/${types_1.keys.routines}`;
    exports.STATE_CHANGED_ROUTINES = STATE_CHANGED_ROUTINES;
    const STATE_CHANGED_SEARCH = `state/changed/${types_1.keys.search}`;
    exports.STATE_CHANGED_SEARCH = STATE_CHANGED_SEARCH;
    const SIDEBAR_DOCKED = "sidebar/docked/";
    exports.SIDEBAR_DOCKED = SIDEBAR_DOCKED;
    const SIDEBAR_UNDOCKED = "sidebar/undocked/";
    exports.SIDEBAR_UNDOCKED = SIDEBAR_UNDOCKED;
    const CLOSE_CONTEXT_MENU = "context-menu/close/";
    exports.CLOSE_CONTEXT_MENU = CLOSE_CONTEXT_MENU;
    const SET_APP_STATUS = "app/status/";
    exports.SET_APP_STATUS = SET_APP_STATUS;
    const API_INITIAL = "api/initial/";
    exports.API_INITIAL = API_INITIAL;
    const WS_CHANGED = "app/schema/";
    exports.WS_CHANGED = WS_CHANGED;
    const ITEM_COUNT_CHANGED = "item/count/";
    exports.ITEM_COUNT_CHANGED = ITEM_COUNT_CHANGED;
});
//# sourceMappingURL=pubsub.js.map