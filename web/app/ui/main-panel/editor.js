define(["require", "exports", "app/api", "app/_sys/pubsub", "app/_sys/timeout", "vs/editor/editor.main"], function (require, exports, api_1, pubsub_1, timeout_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nullEditor = new (class {
        dispose() { return this; }
        initiateLayout() { return this; }
        layout() { return this; }
        focus() { return this; }
        setContent(value) { return this; }
    })();
    class Editor {
        constructor(container, content, language, scriptContent = null) {
            this.container = container;
            this.content = content;
            const element = String.html `<div style="position: fixed;"></div>`.toElement();
            this.container.append(element);
            const value = scriptContent ? scriptContent.content : "";
            this.monaco = monaco.editor.create(element, {
                value: value,
                language,
                theme: "vs-dark",
                renderWhitespace: "all",
                automaticLayout: false
            });
            this.content.dataAttr("contentHash", value.hashCode());
            if (scriptContent && scriptContent.viewState) {
                this.monaco.restoreViewState(scriptContent.viewState);
                this.content.dataAttr("viewStateHash", JSON.stringify(scriptContent.viewState).hashCode());
            }
            this.monaco.onDidChangeModelContent(() => this.initiateSaveContent());
            this.monaco.onDidChangeCursorPosition(() => this.initiateSaveContent());
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
            timeout_1.timeout(() => this.layout(), 25, "editor-layout");
            return this;
        }
        focus() {
            if (!this.monaco.hasTextFocus()) {
                this.monaco.focus();
            }
            return this;
        }
        setContent(value) {
            this.monaco.setValue(value.content);
            if (value.viewState) {
                this.monaco.restoreViewState(value.viewState);
            }
            if (value.content != null) {
                this.content.dataAttr("contentHash", value.content.hashCode());
            }
            if (value.viewState != null) {
                this.content.dataAttr("viewStateHash", JSON.stringify(value.viewState).hashCode());
            }
            return this;
        }
        initiateSaveContent() {
            timeout_1.timeoutAsync(async () => {
                let content = this.monaco.getValue();
                let viewState = JSON.stringify(this.monaco.saveViewState());
                const contentHash = content.hashCode();
                const viewStateHash = viewState.hashCode();
                const data = this.content.dataAttr("data");
                if (contentHash === this.content.dataAttr("contentHash")) {
                    content = null;
                }
                if (viewStateHash === this.content.dataAttr("viewStateHash")) {
                    viewState = null;
                }
                if (content !== null || viewState != null) {
                    let response = await api_1.saveScriptContent(data.connection, data.id, content, viewState);
                    if (response.ok) {
                        data.timestamp = response.data;
                        pubsub_1.publish(pubsub_1.SCRIPT_UPDATED, data);
                    }
                }
                if (content != null) {
                    this.content.dataAttr("contentHash", contentHash);
                }
                if (viewState != null) {
                    this.content.dataAttr("viewStateHash", viewStateHash);
                }
            }, 500, "editor-save");
        }
    }
    exports.Editor = Editor;
});
//# sourceMappingURL=editor.js.map