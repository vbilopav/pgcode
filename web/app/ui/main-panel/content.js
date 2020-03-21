define(["require", "exports", "app/controls/splitter", "app/api", "vs/editor/editor.main"], function (require, exports, splitter_1, api_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            this.container = element;
        }
        createNew(id, key, data) {
            if (this.active) {
                this.active.hideElement();
            }
            this.active = this.createElement(id, key, data)
                .hideElement()
                .attr("id", id)
                .dataAttr("key", key)
                .dataAttr("data", data)
                .addClass("content")
                .appendElementTo(this.container);
        }
        activate(id) {
            const e = this.container.find("#" + id);
            if (!e.length) {
                return;
            }
            if (this.active) {
                this.active.hideElement();
            }
            this.active = e.showElement();
        }
        createElement(id, key, data) {
            if (key == api_1.Keys.SCRIPTS) {
                const element = String.html `
                <div>
                    <div class="editor">${data.name}</div>
                    <div></div><!-- main splitter vertical -->
                    <div class="grid"></div><!-- main panel -->
                </div>`
                    .toElement()
                    .addClass("split-content")
                    .css("grid-template-rows", "auto 5px 50px");
                new splitter_1.HorizontalSplitter({
                    element: element.children[1],
                    container: element,
                    resizeIndex: 2,
                    maxDelta: 100,
                    min: 25,
                }).start();
                return element;
            }
            return String.html `
            <div>
                ${key.toString()}:  ${data.name}
            </div>`
                .toElement();
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=content.js.map