define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _keys = {};
    const _promises = {};
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
    exports.timeoutAsync = async (handler, timeout, key) => {
        let t = _keys[key];
        if (t) {
            clearTimeout(t);
            _keys[key] = undefined;
            _promises[key] && await _promises[key];
        }
        _keys[key] = setTimeout(async () => {
            const promise = handler();
            _promises[key] = promise;
            await promise;
            clearTimeout(_keys[key]);
            _keys[key] = undefined;
            _promises[key] = undefined;
        }, timeout);
    };
    class Consumer {
        constructor(handler, timeout) {
            this.shouldRun = false;
            this.timeout = 0;
            if (handler) {
                this.handler = handler;
            }
            if (timeout) {
                this.timeout = timeout;
            }
            this.start();
        }
        run(handler) {
            if (handler) {
                this.handler = handler;
            }
            this.shouldRun = true;
        }
        stop() {
            this.shouldRun = false;
        }
        start() {
            setTimeout(async () => {
                if (this.shouldRun) {
                    this.shouldRun = false;
                    await this.handler();
                }
                this.start();
            }, this.timeout);
        }
    }
    exports.Consumer = Consumer;
});
//# sourceMappingURL=timeout.js.map