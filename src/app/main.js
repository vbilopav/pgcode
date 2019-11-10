define(["require", "exports", "vs/editor/editor.main"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            element.html("main area");
            monaco.editor.create(element, {
                value: "",
                language: "pgsql",
                theme: "vs-dark",
                renderWhitespace: "all",
                automaticLayout: false
            });
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=main.js.map