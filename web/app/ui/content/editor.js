define(["require", "exports", "app/api", "app/_sys/pubsub", "app/_sys/timeout", "app/ui/content/monaco-config"], function (require, exports, api_1, pubsub_1, timeout_1, monaco_config_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nullEditor = new (class {
        dispose() { return this; }
        initiateLayout() { return this; }
        layout() { return this; }
        focus() { return this; }
        setContent(value) { return this; }
        getContent() { return null; }
        actionRun(id) { return this; }
    })();
    class Editor {
        constructor(id, container, content, language, scriptContent = null) {
            this.id = id;
            console.log("editor created", this.id);
            this.container = container;
            this.content = content;
            const element = String.html `<div style="position: fixed;"></div>`.toElement();
            this.container.append(element);
            this.monaco = monaco_config_1.createEditor(element, language);
            this.language = language;
            if (scriptContent) {
                this.setContent(scriptContent);
            }
            this.monaco.onDidChangeModelContent(() => this.initiateSaveContent());
            this.monaco.onDidChangeCursorPosition(() => this.initiateSaveContent());
            this.monaco.onDidScrollChange(() => this.initiateSaveScroll());
            window.on("resize", () => this.initiateLayout());
            pubsub_1.subscribe([pubsub_1.SIDEBAR_DOCKED, pubsub_1.SPLITTER_CHANGED, pubsub_1.SIDEBAR_UNDOCKED], () => this.initiateLayout());
        }
        dispose() {
            this.monaco.dispose();
            console.log("editor disposed", this.id);
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
            timeout_1.timeout(() => this.layout(), 50, `${this.id}-editor-layout`);
            return this;
        }
        focus() {
            if (!this.monaco.hasTextFocus()) {
                this.monaco.focus();
            }
            return this;
        }
        setContent(value) {
            if (value.content != null) {
                this.monaco.setValue(value.content);
                this.content.dataAttr("contentHash", value.content.hashCode());
            }
            if (value.viewState) {
                this.monaco.restoreViewState(value.viewState);
                this.content.dataAttr("viewStateHash", JSON.stringify(value.viewState).hashCode());
            }
            if (value.scrollPosition) {
                this.content.dataAttr("scrollTop", value.scrollPosition.scrollTop);
                this.content.dataAttr("scrollLeft", value.scrollPosition.scrollLeft);
                this.monaco.setScrollPosition(value.scrollPosition);
            }
            return this;
        }
        getContent() {
            return this.monaco.getValue();
        }
        actionRun(id) {
            this.monaco.getAction(id).run();
            return this;
        }
        initiateSaveContent() {
            timeout_1.timeout(() => {
                const position = this.monaco.getPosition();
                const selection = this.monaco.getSelection();
                let selectionLength = 0;
                if (selection.startColumn != selection.endColumn || selection.startLineNumber != selection.endLineNumber) {
                    const value = this.monaco.getModel().getValueInRange(selection);
                    selectionLength = value.length;
                }
                pubsub_1.publish(pubsub_1.EDITOR_POSITION, this.language, position.lineNumber, position.column, selectionLength);
            }, 50, `${this.id}-editor-position`);
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
            }, 500, `${this.id}-editor-save`);
        }
        initiateSaveScroll() {
            timeout_1.timeoutAsync(async () => {
                let top = this.monaco.getScrollTop();
                let left = this.monaco.getScrollLeft();
                if (top != this.content.dataAttr("scrollTop") || left != this.content.dataAttr("scrollLeft")) {
                    this.content.dataAttr("scrollTop", top).dataAttr("scrollLeft", left);
                    const data = this.content.dataAttr("data");
                    await api_1.saveScriptScrollPosition(data.connection, data.id, top, left);
                }
            }, 1000, `${this.id}-editor-scroll`);
        }
    }
    exports.Editor = Editor;
});
//# sourceMappingURL=editor.js.map