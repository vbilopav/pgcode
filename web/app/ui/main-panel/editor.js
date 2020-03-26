define(["require", "exports", "app/_sys/pubsub", "vs/editor/editor.main"], function (require, exports, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(container, content, language) {
            this.container = container;
            this.content = content;
            const element = String.html `<div style="position: fixed;"></div>`.toElement();
            this.container.append(element);
            this.monaco = monaco.editor.create(element, {
                value: "",
                language,
                theme: "vs-dark",
                renderWhitespace: "all",
                automaticLayout: false
            });
            window.on("resize", () => this.initiateLayout());
            pubsub_1.subscribe([pubsub_1.SIDEBAR_DOCKED, pubsub_1.SPLITTER_CHANGED, pubsub_1.SIDEBAR_UNDOCKED], () => this.initiateLayout());
        }
        dispose() {
            this.monaco.dispose();
        }
        layout() {
            if (!this.content.hasClass("active")) {
                return;
            }
            this.monaco.layout({
                height: this.container.clientHeight,
                width: this.container.clientWidth
            });
        }
        initiateLayout() {
            if (this.layoutTimeout) {
                clearTimeout(this.layoutTimeout);
            }
            this.layoutTimeout = setTimeout(() => this.layout(), 25);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=editor.js.map