define(["require", "exports", "app/types", "app/ui/side-panel/panel"], function (require, exports, types_1, panel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 extends panel_1.default {
        constructor(element) {
            super(element, types_1.Keys.SEARCH);
        }
        schemaChanged(data) { }
    }
    exports.default = default_1;
});
//# sourceMappingURL=search.js.map