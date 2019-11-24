define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _entries = {};
    const subscribe = (name, handler) => {
        const doSub = topic => {
            let entry = _entries[topic];
            if (!entry) {
                entry = entry[topic] = [];
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
                callback(args);
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
    const BUTTON_CHANGED_OFF = name => `/button/changed/off/${name}`;
    exports.BUTTON_CHANGED_OFF = BUTTON_CHANGED_OFF;
    const BUTTON_CHANGED_ON = name => `/button/changed/on/${name}`;
    exports.BUTTON_CHANGED_ON = BUTTON_CHANGED_ON;
});
//# sourceMappingURL=pubsub.js.map