define(["require", "exports", "app/api", "app/_sys/pubsub", "app/_sys/timeout", "app/ui/content/monaco-config"], function (require, exports, api_1, pubsub_1, timeout_1, monaco_config_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nullEditor = new (class {
        dispose() { return this; }
        layout() { return this; }
        focus() { return this; }
        setContent(value) { return this; }
        getContent() { return null; }
        actionRun(id) { return this; }
    })();
    var FooterMsgTypes;
    (function (FooterMsgTypes) {
        FooterMsgTypes[FooterMsgTypes["Exe"] = 0] = "Exe";
    })(FooterMsgTypes || (FooterMsgTypes = {}));
    class Editor {
        constructor(id, container, content, language, scriptContent, results) {
            this.tempViewState = null;
            this.executionDisabled = false;
            this.id = id;
            this.results = results;
            this.data = content.dataAttr("data");
            this.container = container;
            this.content = content;
            const element = String.html `<div style="position: fixed;"></div>`.toElement();
            this.container.append(element);
            this.monaco = monaco_config_1.createEditor(element, language);
            this.language = language;
            if (scriptContent) {
                this.setContent(scriptContent);
            }
            this.selectionDecorations = [];
            this.initActions();
            this.initMonacoEvents();
            this.subscribeToEvents();
            this.initConnection();
        }
        dispose() {
            this.monaco.dispose();
            api_1.disposeConnection(this.id);
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
        subscribeToEvents() {
            window.on("resize", () => this.initiateLayout());
            pubsub_1.subscribe([pubsub_1.SIDEBAR_DOCKED, pubsub_1.SPLITTER_CHANGED, pubsub_1.SIDEBAR_UNDOCKED], () => this.initiateLayout());
            pubsub_1.subscribe(pubsub_1.FOOTER_MESSAGE_DISMISSED, type => {
                setTimeout(() => {
                    if (this.tempViewState && type == FooterMsgTypes.Exe) {
                        this.monaco.restoreViewState(this.tempViewState);
                        this.tempViewState = null;
                    }
                });
            });
        }
        initActions() {
            this.monaco.addAction({
                id: monaco_config_1.commandIds.execute,
                label: "Execute",
                keybindings: [
                    monaco.KeyCode.F5
                ],
                precondition: null,
                keybindingContext: null,
                contextMenuGroupId: "execution",
                contextMenuOrder: 1.5,
                run: () => this.execute()
            });
            this.monaco.addAction({
                id: monaco_config_1.commandIds.selectAll,
                label: "Select All",
                keybindings: [
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_A,
                ],
                precondition: null,
                keybindingContext: null,
                contextMenuGroupId: "9_cutcopypaste",
                contextMenuOrder: 2,
                run: (editor) => {
                    editor.trigger("pgcode-editor", "selectAll", null);
                }
            });
        }
        initMonacoEvents() {
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
            this.monaco.onKeyDown(() => pubsub_1.publish(pubsub_1.DISMISS_FOOTER_MESSAGE));
        }
        async initConnection() {
            try {
                const response = await api_1.initConnection(this.data.connection, this.data.schema, this.id);
                if (!response.ok) {
                    this.executionDisabled = true;
                }
                else {
                    this.executionDisabled = false;
                }
            }
            catch (error) {
                this.executionDisabled = true;
            }
            if (this.executionDisabled) {
                this.results.setDisconnected();
            }
            else {
                this.results.setReady();
            }
            return !this.executionDisabled;
        }
        execute() {
            if (this.executionDisabled) {
                pubsub_1.publish(pubsub_1.FOOTER_MESSAGE, "execution has been disabled, your connection may be broken, try restarting application");
            }
            else {
                const selection = this.monaco.getSelection();
                if (!selection.isEmpty()) {
                    const value = this.monaco.getModel().getValueInRange(selection);
                    this.results.start();
                    api_1.execute({
                        connection: this.data.connection,
                        schema: this.data.schema,
                        id: this.id,
                        content: value,
                        events: {
                            error: e => this.results.error(e),
                            notice: e => this.results.notice(e)
                        }
                    }).then(response => this.results.end(response));
                }
                else {
                    this.tempViewState = this.monaco.saveViewState();
                    pubsub_1.publish(pubsub_1.FOOTER_MESSAGE, "Hit F5 again to execute or any other key to continue...", FooterMsgTypes.Exe);
                    this.actionRun(monaco_config_1.commandIds.selectAll);
                }
            }
        }
        initiateLayout() {
            timeout_1.timeout(() => this.layout(), 25, `${this.id}-editor-layout`);
            return this;
        }
        renumberSelection() {
            timeout_1.timeout(() => {
                const selection = this.monaco.getSelection();
                if (selection.isEmpty()) {
                    return;
                }
                for (let m of this.container.querySelectorAll(".selection-decoration")) {
                    let e = m.nextElementSiblingWithClass("line-numbers");
                    let ln = e.html();
                    if (isNaN(ln)) {
                        continue;
                    }
                    m.html(`${ln - selection.startLineNumber + 1}`);
                }
            }, 25, `${this.id}-renumber-selection`);
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
                if (contentHash === this.content.dataAttr("contentHash")) {
                    content = null;
                }
                if (viewStateHash === this.content.dataAttr("viewStateHash")) {
                    viewState = null;
                }
                if (content !== null || viewState != null) {
                    let response = await api_1.saveScriptContent(this.data.connection, this.data.id, content, viewState);
                    if (response.ok) {
                        this.data.timestamp = response.data;
                        pubsub_1.publish(pubsub_1.SCRIPT_UPDATED, this.data);
                    }
                }
                if (content != null) {
                    this.content.dataAttr("contentHash", contentHash);
                }
                if (viewState != null) {
                    this.content.dataAttr("viewStateHash", viewStateHash);
                }
            }, 250, `${this.id}-editor-save`);
        }
        initiateSaveScroll() {
            timeout_1.timeoutAsync(async () => {
                let top = this.monaco.getScrollTop();
                let left = this.monaco.getScrollLeft();
                if (top != this.content.dataAttr("scrollTop") || left != this.content.dataAttr("scrollLeft")) {
                    this.content.dataAttr("scrollTop", top).dataAttr("scrollLeft", left);
                    await api_1.saveScriptScrollPosition(this.data.connection, this.data.id, top, left);
                }
            }, 250, `${this.id}-editor-scroll`);
        }
    }
    exports.Editor = Editor;
});
//# sourceMappingURL=editor.js.map