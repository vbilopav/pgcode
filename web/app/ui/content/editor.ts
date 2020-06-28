import {
    classes, IScriptContent, saveScriptContent, saveScriptScrollPosition, IScriptInfo
} from "app/api";
import {
    SIDEBAR_DOCKED, SIDEBAR_UNDOCKED, SPLITTER_CHANGED, SCRIPT_UPDATED, EDITOR_POSITION, subscribe, publish
} from "app/_sys/pubsub";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import {timeout, timeoutAsync} from "app/_sys/timeout";
import {createEditor, commandIds} from "app/ui/content/monaco-config";

export interface IEditor {
    dispose(): IEditor;
    layout(): IEditor;
    initiateLayout(): IEditor;
    focus(): IEditor;
    setContent(value: IScriptContent) : IEditor;
    getContent() : string;
    actionRun(id: string) : IEditor;
}

export const nullEditor = new (class implements IEditor {
    dispose() {return this}
    initiateLayout() {return this}
    layout() {return this}
    focus() {return this}
    setContent(value: IScriptContent) {return this}
    getContent() : string {return null}
    actionRun(id: string) {return this}
})();

export class Editor implements IEditor {
    private readonly id: string;
    private readonly monaco: IStandaloneCodeEditor;
    private readonly content: Element;
    private readonly container: Element;
    private readonly language;

    constructor(id: string, container: Element, content: Element, language: string, scriptContent: IScriptContent = null) {
        this.id = id;
        
        console.log("editor created", this.id);

        this.container = container;
        this.content = content;
        const element = String.html`<div style="position: fixed;"></div>`.toElement();
        this.container.append(element);
        this.monaco = createEditor(element, language, () => this.execute());
        this.language = language;
        if (scriptContent) {
            this.setContent(scriptContent);
        }

        this.monaco.onDidChangeModelContent(() => this.initiateSaveContent());
        this.monaco.onDidChangeCursorPosition(() => this.initiateSaveContent());
        this.monaco.onDidScrollChange(() => this.initiateSaveScroll());

        window.on("resize", () => this.initiateLayout());
        subscribe([SIDEBAR_DOCKED, SPLITTER_CHANGED, SIDEBAR_UNDOCKED], () =>  this.initiateLayout());
    }

    execute() {
        const selection = this.monaco.getSelection();
        if (!selection.isEmpty()) {
            const value = this.monaco.getModel().getValueInRange(selection);
            console.log("Execute:", value);
        } else {
            // get the view state and restore if execute is canceled 
            this.actionRun(commandIds.selectAll);
        }
    }

    dispose() {
        this.monaco.dispose();

        console.log("editor disposed", this.id);

        return this;
    }

    layout() {
        if (!this.content.hasClass(classes.active)) {
            return this;
        }
        this.monaco.layout({
            height: this.container.clientHeight,
            width: this.container.clientWidth
        });
        return this;
    }

    initiateLayout() {
        timeout(() => this.layout(), 50, `${this.id}-editor-layout`);
        return this;
    }

    focus() {
        if (!this.monaco.hasTextFocus()) {
            this.monaco.focus();
        }
        return this;
    }

    setContent(value: IScriptContent) {
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

    getContent() : string {
        return this.monaco.getValue();
    }

    actionRun(id: string) {
        this.monaco.getAction(id).run();
        return this;
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
            let content = this.monaco.getValue();
            let viewState = JSON.stringify(this.monaco.saveViewState());
            const contentHash = content.hashCode();
            const viewStateHash = viewState.hashCode();
            const data = this.content.dataAttr("data") as IScriptInfo;
            if (contentHash === this.content.dataAttr("contentHash")) {
                content = null;
            }
            if (viewStateHash === this.content.dataAttr("viewStateHash")) {
                viewState = null;
            }
            if (content !== null || viewState != null) {
                let response = await saveScriptContent(data.connection, data.id, content, viewState);
                if (response.ok) {
                    data.timestamp = response.data;
                    publish(SCRIPT_UPDATED, data);
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

    private initiateSaveScroll() {
        timeoutAsync(async () => {
            let top = this.monaco.getScrollTop();
            let left = this.monaco.getScrollLeft();
            if (top != this.content.dataAttr("scrollTop") || left != this.content.dataAttr("scrollLeft"))  {
                this.content.dataAttr("scrollTop", top).dataAttr("scrollLeft", left);
                const data = this.content.dataAttr("data") as IScriptInfo;
                await saveScriptScrollPosition(data.connection, data.id, top, left);
            }
        }, 1000, `${this.id}-editor-scroll`);
    }
}