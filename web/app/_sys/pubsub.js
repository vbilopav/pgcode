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
});
//# sourceMappingURL=pubsub.js.map