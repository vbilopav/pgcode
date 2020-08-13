import {
    classes, 
    IScriptContent, 
    saveScriptContent, 
    saveScriptScrollPosition, 
    IScriptInfo,
    initConnection,
    disposeConnection
} from "app/api";
import {
    SIDEBAR_DOCKED, 
    SIDEBAR_UNDOCKED, 
    SPLITTER_CHANGED, 
    SCRIPT_UPDATED, 
    EDITOR_POSITION, 
    FOOTER_MESSAGE, 
    DISMISS_FOOTER_MESSAGE,
    FOOTER_MESSAGE_DISMISSED,
    subscribe, publish
} from "app/_sys/pubsub";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import ICodeEditor = monaco.editor.ICodeEditor;
import {timeout, timeoutAsync} from "app/_sys/timeout";
import {createEditor, commandIds} from "app/ui/content/monaco-config";
import ResultsPane from "app/ui/results-pane/results-pane"

export interface IEditor {
    dispose(): IEditor;
    layout(): IEditor;
    //initiateLayout(): IEditor;
    focus(): IEditor;
    setContent(value: IScriptContent) : IEditor;
    getContent() : string;
    actionRun(id: string) : IEditor;
}

export const nullEditor = new (class implements IEditor {
    dispose() {return this}
    //initiateLayout() {return this}
    layout() {return this}
    focus() {return this}
    setContent(value: IScriptContent) {return this}
    getContent() : string {return null}
    actionRun(id: string) {return this}
})();

enum FooterMsgTypes {Exe}

export class Editor implements IEditor {
    private readonly id: string;
    private readonly data: IScriptInfo;
    private readonly monaco: IStandaloneCodeEditor;
    private readonly content: Element;
    private readonly container: Element;
    private readonly language;
    private readonly results: ResultsPane
    private selectionDecorations: string[];
    private tempViewState: monaco.editor.ICodeEditorViewState = null;
    private executionDisabled = false;

    constructor(id: string, container: Element, content: Element, language: string, scriptContent: IScriptContent, results: ResultsPane) {
        this.id = id;
        this.results = results;
        this.data = content.dataAttr("data") as IScriptInfo;
        this.container = container;
        this.content = content;
        const element = String.html`<div style="position: fixed;"></div>`.toElement();
        this.container.append(element);
        this.monaco = createEditor(element, language);
        this.language = language;
        if (scriptContent) {
            this.setContent(scriptContent);
        }
        this.selectionDecorations = [];
        
        this.initActions();
        this.initMonacoEvents();
        this.subscribeToEvents();

        initConnection(this.data.connection,  this.data.schema, this.id).then(resp => {
            if (!resp.ok) {
                this.executionDisabled = true;
            } else {
                this.executionDisabled = false;
            }
            this.executionDisabled = true;
        }).catch(() => {
            this.executionDisabled = true;
        });
    }

    public dispose() {
        this.monaco.dispose();
        disposeConnection(this.id);
        return this;
    }

    public layout() {
        if (!this.content.hasClass(classes.active)) {
            return this;
        }
        this.monaco.layout({
            height: this.container.clientHeight,
            width: this.container.clientWidth
        });
        return this;
    }

    public focus() {
        if (!this.monaco.hasTextFocus()) {
            this.monaco.focus();
        }
        return this;
    }

    public setContent(value: IScriptContent) {
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
        setTimeout(() => {this.renumberSelection()}, 225);

        return this;
    }

    public getContent() : string {
        return this.monaco.getValue();
    }

    public actionRun(id: string) {
        this.monaco.getAction(id).run();
        return this;
    }

    private subscribeToEvents() {
        window.on("resize", () => this.initiateLayout());
        subscribe([SIDEBAR_DOCKED, SPLITTER_CHANGED, SIDEBAR_UNDOCKED], () =>  this.initiateLayout());
        subscribe(FOOTER_MESSAGE_DISMISSED, type => {
            if (this.tempViewState && type == FooterMsgTypes.Exe) {
                this.monaco.restoreViewState(this.tempViewState);
                this.tempViewState = null;
            }
        });
    }

    private initActions() {
        this.monaco.addAction({
            id: commandIds.execute,
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
            id: commandIds.selectAll,
            label: "Select All",
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_A,
            ],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: "9_cutcopypaste",
            contextMenuOrder: 2,
            run: (editor: ICodeEditor) => {
                editor.trigger("pgcode-editor", "selectAll", null);
            }
        });
    }

    private initMonacoEvents() {
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
                    options: {isWholeLine: true, glyphMarginClassName: "current-line-decoration"}
                }]);
            } else {
                this.selectionDecorations = this.monaco.deltaDecorations(this.selectionDecorations, [{
                    range: e.selection,
                    options: {isWholeLine: true, glyphMarginClassName: "selection-decoration"}
                }]);
            }
            this.renumberSelection();
        });
        this.monaco.onKeyDown(() => publish(DISMISS_FOOTER_MESSAGE));
    }

    private execute() {
        if (this.executionDisabled) {
            publish(FOOTER_MESSAGE, "execution is disabled (connection may be broken)");
        } else {
            const selection = this.monaco.getSelection();
            if (!selection.isEmpty()) {
                const value = this.monaco.getModel().getValueInRange(selection);
                this.results.runExecution(value);
            } else {
                this.tempViewState = this.monaco.saveViewState();
                publish(FOOTER_MESSAGE, "Hit F5 again to execute or any other key to continue...", FooterMsgTypes.Exe);
                this.actionRun(commandIds.selectAll);
            }
        }
    }

    private initiateLayout() {
        timeout(() => this.layout(), 25, `${this.id}-editor-layout`);
        return this;
    }

    private renumberSelection() {
        timeout(() => {
            const selection = this.monaco.getSelection();
            if (selection.isEmpty()) {
                return;
            }
            for(let m of this.container.querySelectorAll(".selection-decoration")) {
                let e = m.nextElementSiblingWithClass("line-numbers"); 
                let ln = e.html() as any as number;
                if (isNaN(ln)) {
                    continue;
                }
                (m as HTMLElement).html(`${ln - selection.startLineNumber + 1}`);
            }
        }, 25, `${this.id}-renumber-selection`);
    }

    private initiateSaveContent() {
        
        timeout(() => {
            const position = this.monaco.getPosition();
            const selection = this.monaco.getSelection();
            let selectionLength = 0;
            if (!selection.isEmpty()) {
                const value = this.monaco.getModel().getValueInRange(selection);
                selectionLength = value.length;
            }
            publish(EDITOR_POSITION, this.language, position.lineNumber, position.column, selectionLength);
        }, 50, `${this.id}-editor-position`);

        timeoutAsync(async () => {
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
                let response = await saveScriptContent(this.data.connection, this.data.id, content, viewState);
                if (response.ok) {
                    this.data.timestamp = response.data;
                    publish(SCRIPT_UPDATED, this.data);
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

    private initiateSaveScroll() {
        timeoutAsync(async () => {
            let top = this.monaco.getScrollTop();
            let left = this.monaco.getScrollLeft();
            if (top != this.content.dataAttr("scrollTop") || left != this.content.dataAttr("scrollLeft"))  {
                this.content.dataAttr("scrollTop", top).dataAttr("scrollLeft", left);
                await saveScriptScrollPosition(this.data.connection, this.data.id, top, left);
            }
        }, 250, `${this.id}-editor-scroll`);
    }
}