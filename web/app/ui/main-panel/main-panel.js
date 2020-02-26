define(["require", "exports", "vs/editor/editor.main"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            element.addClass("main-panel").html(String.html `<div></div><div></div>`);
            this.tabs = element.children[0];
            this.content = element.children[1];
        }
        async activateScript(id, title) {
            String.html `
        <div>
            <i class="icon-doc-text"></i>
            <span>${title}</span>
            <i class="close" title="close">&#10006</i>
        </div>`
                .toElement()
                .appendElementTo(this.tabs);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=main-panel.js.map