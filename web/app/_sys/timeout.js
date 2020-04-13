define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _keys = {};
    exports.default = (handler, timeout, key) => {
        let t = _keys[key];
        if (t) {
            clearTimeout(t);
            _keys[key] = undefined;
        }
        _keys[key] = setTimeout(() => {
            clearTimeout(_keys[key]);
            _keys[key] = undefined;
            handler();
        }, timeout);
    };
});
//# sourceMappingURL=timeout.js.map