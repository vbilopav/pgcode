define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _entries = {};
    const _hashes = {};
    exports.subscribe = (name, handler, skipDups) => {
        const doSub = topic => {
            let entry = _entries[topic];
            if (!entry) {
                entry = _entries[topic] = [];
            }
            const hash = (topic + handler).hashCode();
            if (!skipDups) {
                _hashes[hash] = true;
                _entries[topic].push(handler);
            }
            else {
                if (!_hashes[hash]) {
                    _hashes[hash] = true;
                    return _entries[topic].push(handler) - 1;
                }
            }
            return hash;
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
        }
        entry.splice(ref, 1);
        return true;
    };
    exports.STATE_CHANGED_ON = "state/changed/on/";
    exports.STATE_CHANGED_OFF = "state/changed/off/";
    exports.STATE_CHANGED = "state/changed/";
    exports.STATE_CHANGED_SCRIPTS = `state/changed/scripts`;
    exports.STATE_CHANGED_TABLES = `state/changed/tables`;
    exports.STATE_CHANGED_VIEWS = `state/changed/views`;
    exports.STATE_CHANGED_ROUTINES = `state/changed/routines`;
    exports.STATE_CHANGED_SEARCH = `state/changed/search`;
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
    exports.SCRIPT_UPDATED = `script/updated`;
});
//# sourceMappingURL=pubsub.js.map