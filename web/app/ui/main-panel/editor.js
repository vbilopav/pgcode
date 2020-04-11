define(["require", "exports", "app/api", "app/_sys/pubsub", "vs/editor/editor.main"], function (require, exports, api_1, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nullEditor = new (class {
        dispose() { return this; }
        initiateLayout() { return this; }
        layout() { return this; }
        focus() { return this; }
        setValues(value, viewState) { return this; }
    })();
    class Editor {
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
            return this;
        }
        layout() {
            if (!this.content.hasClass(api_1.classes.active)) {
                return this;
            }
            this.monaco.layout({
                height: this.container.clientHeight,
                width: this.container.clientWidth
            });
            return this;
        }
        initiateLayout() {
            if (this.layoutTimeout) {
                clearTimeout(this.layoutTimeout);
            }
            this.layoutTimeout = setTimeout(() => this.layout(), 25);
            return this;
        }
        focus() {
            if (!this.monaco.hasTextFocus()) {
                this.monaco.focus();
            }
            return this;
        }
        setValues(value, viewState) {
            this.monaco.setValue(value);
            if (viewState) {
                this.monaco.restoreViewState(JSON.parse(viewState));
            }
            return this;
        }
    }
    exports.Editor = Editor;
});
//# sourceMappingURL=editor.js.map