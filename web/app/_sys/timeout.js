define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _keys = {};
    exports.timeout = (handler, timeout, key) => {
        let t = _keys[key];
        if (t) {
            clearTimeout(t);
            _keys[key] = undefined;
        }
        _keys[key] = setTimeout(() => {
            handler();
            clearTimeout(_keys[key]);
            _keys[key] = undefined;
        }, timeout);
    };
    exports.timeoutAsync = (handler, timeout, key) => {
        let t = _keys[key];
        if (t) {
            clearTimeout(t);
            _keys[key] = undefined;
        }
        _keys[key] = setTimeout(async () => {
            await handler();
            clearTimeout(_keys[key]);
            _keys[key] = undefined;
        }, timeout);
    };
});
//# sourceMappingURL=timeout.js.map