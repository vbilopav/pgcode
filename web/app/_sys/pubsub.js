define(["require", "exports", "app/types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _entries = {};
    exports.subscribe = (name, handler) => {
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
    exports.publish = (name, ...args) => {
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
    exports.unsubscribe = (name, ref) => {
        let entry = _entries[name];
        if (!entry) {
            return false;
            ;
        }
        entry.splice(ref, 1);
        return true;
    };
    exports.STATE_CHANGED_ON = "state/changed/on/";
    exports.STATE_CHANGED_OFF = "state/changed/off/";
    exports.STATE_CHANGED = "state/changed/";
    exports.STATE_CHANGED_SCRIPTS = `state/changed/${types_1.Keys.SCRIPTS}`;
    exports.STATE_CHANGED_TABLES = `state/changed/${types_1.Keys.TABLES}`;
    exports.STATE_CHANGED_VIEWS = `state/changed/${types_1.Keys.VIEWS}`;
    exports.STATE_CHANGED_ROUTINES = `state/changed/${types_1.Keys.ROUTINES}`;
    exports.STATE_CHANGED_SEARCH = `state/changed/${types_1.Keys.SEARCH}`;
    exports.SIDEBAR_DOCKED = "sidebar/docked/";
    exports.SIDEBAR_UNDOCKED = "sidebar/undocked/";
    exports.CLOSE_CONTEXT_MENU = "context-menu/close/";
    exports.SET_APP_STATUS = "app/status/";
    exports.API_INITIAL = "api/initial/";
    exports.SCHEMA_CHANGED = "app/schema/";
    exports.ITEM_COUNT_CHANGED = "item/count/";
    exports.SPLITTER_CHANGED = "splitter/changed";
    exports.TAB_SELECTED = `tab/selected`;
    exports.TAB_UNSELECTED = `tab/unselected`;
});
//# sourceMappingURL=pubsub.js.map