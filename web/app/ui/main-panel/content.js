define(["require", "exports", "vs/editor/editor.main"], function (require, exports) {
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
            var e = this.container.find("#" + id);
            if (!e.length) {
                return;
            }
            if (this.active) {
                this.active.hideElement();
            }
            this.active = e.showElement();
        }
        createElement(id, key, data) {
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