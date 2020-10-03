define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            this.element = element;
        }
        clear() {
            this.element.html("");
        }
        message(e) {
            document.createElement("code").html(JSON.stringify(e)).appendElementTo(this.element);
        }
        finished(e) {
            document.createElement("code").html(JSON.stringify(e)).appendElementTo(this.element);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=messages.js.map