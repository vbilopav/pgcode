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
            this.tempViewState = null;
            this.id = id;
            console.log("editor created", this.id);
            this.container = container;
            this.content = content;
            const element = String.html `<div style="position: fixed;"></div>`.toElement();
            this.container.append(element);
            this.monaco = monaco_config_1.createEditor(element, language, () => this.execute());
            this.selectionDecorations = [];
            this.language = language;
            if (scriptContent) {
                this.setContent(scriptContent);
            }
            this.monaco.onDidChangeModelContent(() => this.initiateSaveContent());
            this.monaco.onDidChangeCursorPosition(() => this.initiateSaveContent());
            this.monaco.onDidScrollChange(() => {
                this.renumberSelection();
                this.initiateSaveScroll();
            });
            this.monaco.onDidChangeCursorSelection(e => {
                if (e.selection.isEmpty()) {
                    this.selectionDecorations = this.monaco.deltaDecorations(this.selectionDecorations, [{
                            range: e.selection,
                            options: { isWholeLine: true, glyphMarginClassName: "current-line-decoration" }
                        }]);
                }
                else {
                    this.selectionDecorations = this.monaco.deltaDecorations(this.selectionDecorations, [{
                            range: e.selection,
                            options: { isWholeLine: true, glyphMarginClassName: "selection-decoration" }
                        }]);
                }
                this.renumberSelection();
            });
            this.monaco.onKeyDown(() => {
                if (this.tempViewState) {
                    pubsub_1.publish(pubsub_1.DISMISS_FOOTER_MESSAGE);
                }
            });
            window.on("resize", () => this.initiateLayout());
            pubsub_1.subscribe([pubsub_1.SIDEBAR_DOCKED, pubsub_1.SPLITTER_CHANGED, pubsub_1.SIDEBAR_UNDOCKED], () => this.initiateLayout());
            pubsub_1.subscribe(pubsub_1.FOOTER_MESSAGE_DISMISSED, () => {
                if (this.tempViewState) {
                    this.monaco.restoreViewState(this.tempViewState);
                    this.tempViewState = null;
                }
            });
        }
        execute() {
            const selection = this.monaco.getSelection();
            if (!selection.isEmpty()) {
                const value = this.monaco.getModel().getValueInRange(selection);
                console.log("Execute:", value);
            }
            else {
                this.tempViewState = this.monaco.saveViewState();
                pubsub_1.publish(pubsub_1.FOOTER_MESSAGE, "Hit F5 again to execute or any other key to continue...");
                this.actionRun(monaco_config_1.commandIds.selectAll);
            }
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
            timeout_1.timeout(() => this.layout(), 25, `${this.id}-editor-layout`);
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
            setTimeout(() => { this.renumberSelection(); }, 225);
            return this;
        }
        getContent() {
            return this.monaco.getValue();
        }
        actionRun(id) {
            this.monaco.getAction(id).run();
            return this;
        }
        renumberSelection() {
            timeout_1.timeout(() => {
                const selection = this.monaco.getSelection();
                if (selection.isEmpty()) {
                    return;
                }
                for (let m of this.container.querySelectorAll(".selection-decoration")) {
                    let e = this.nextUntilHasClass(m, "line-numbers");
                    let ln = e.html();
                    if (isNaN(ln)) {
                        continue;
                    }
                    m.html(`${ln - selection.startLineNumber + 1}`);
                }
            }, 25, `${this.id}-renumber-selection`);
        }
        nextUntilHasClass(e, className) {
            e = e.nextElementSibling;
            if (e.hasClass(className)) {
                return e;
            }
            else {
                return this.nextUntilHasClass(e, className);
            }
        }
        initiateSaveContent() {
            timeout_1.timeout(() => {
                const position = this.monaco.getPosition();
                const selection = this.monaco.getSelection();
                let selectionLength = 0;
                if (!selection.isEmpty()) {
                    const value = this.monaco.getModel().getValueInRange(selection);
                    selectionLength = value.length;
                }
                pubsub_1.publish(pubsub_1.EDITOR_POSITION, this.language, position.lineNumber, position.column, selectionLength);
            }, 50, `${this.id}-editor-position`);
            timeout_1.timeoutAsync(async () => {
                if (this.tempViewState) {
                    return;
                }
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