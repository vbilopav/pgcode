define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    String.prototype.formatDateString = function () {
        const d = new Date(this);
        const today = new Date();
        const fullYear = d.getFullYear();
        const date = d.getDate();
        const month = d.getMonth();
        if (date == today.getDate() && month == today.getMonth() && fullYear == today.getFullYear()) {
            return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
        }
        else {
            return `${fullYear}-${(month + 1).toString().padStart(2, "0")}-${date.toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
        }
    };
    exports.default = null;
});
//# sourceMappingURL=extensions.js.map