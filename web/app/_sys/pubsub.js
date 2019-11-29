define(["require", "exports"], function (require, exports) {
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
    const STATE_CHANGED_DOCS = "state/changed/docs";
    exports.STATE_CHANGED_DOCS = STATE_CHANGED_DOCS;
    const STATE_CHANGED_TABLES = "state/changed/tables";
    exports.STATE_CHANGED_TABLES = STATE_CHANGED_TABLES;
    const STATE_CHANGED_VIEWS = "state/changed/views";
    exports.STATE_CHANGED_VIEWS = STATE_CHANGED_VIEWS;
    const STATE_CHANGED_FUNCS = "state/changed/funcs";
    exports.STATE_CHANGED_FUNCS = STATE_CHANGED_FUNCS;
    const STATE_CHANGED_SEARCH = "state/changed/search";
    exports.STATE_CHANGED_SEARCH = STATE_CHANGED_SEARCH;
    const SIDEBAR_DOCKED = "sidebar/docked/";
    exports.SIDEBAR_DOCKED = SIDEBAR_DOCKED;
    const SIDEBAR_UNDOCKED = "sidebar/undocked/";
    exports.SIDEBAR_UNDOCKED = SIDEBAR_UNDOCKED;
});
//# sourceMappingURL=pubsub.js.map