define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            element.addClass("toolbar").html(String.html `
            <div class="icon-doc-text"></div>
            <div class="icon-database"></div>
            <div class="icon-search"></div>
            <div class="icon-terminal"></div>
        `);
            console.log(element);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=toolbar.js.map