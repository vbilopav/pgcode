import "vs/editor/editor.main";
import {classes, IScriptContent, saveScriptContent, IScriptInfo} from "app/api";
import {
    SIDEBAR_DOCKED, SIDEBAR_UNDOCKED, SPLITTER_CHANGED, SCRIPT_UPDATED, subscribe, publish
} from "app/_sys/pubsub";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import {timeout, timeoutAsync} from "app/_sys/timeout";

export interface IEditor {
    dispose(): IEditor;
    layout(): IEditor;
    initiateLayout(): IEditor;
    focus(): IEditor;
    setContent(value: IScriptContent) : IEditor;
}

export const nullEditor = new (class implements IEditor {
    dispose() {return this}
    initiateLayout() {return this}
    layout() {return this}
    focus() {return this}
    setContent(value: IScriptContent) {return this}
})();

export class Editor implements IEditor {
    private monaco: IStandaloneCodeEditor;
    private readonly content: Element;
    private container: Element;

    constructor(container: Element, content: Element, language: string, scriptContent: IScriptContent = null) {
        this.container = container;
        this.content = content;
        const element = String.html`<div style="position: fixed;"></div>`.toElement();
        this.container.append(element);
        const value = scriptContent ? scriptContent.content : "";
        this.monaco = monaco.editor.create(element as HTMLElement, {
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
        subscribe([SIDEBAR_DOCKED, SPLITTER_CHANGED, SIDEBAR_UNDOCKED], () =>  this.initiateLayout());
    }

    dispose() {
        this.monaco.dispose();
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
        timeout(() => this.layout(), 25, "editor-layout");
        return this;
    }

    focus() {
        if (!this.monaco.hasTextFocus()) {
            this.monaco.focus();
        }
        return this;
    }

    setContent(value: IScriptContent) {
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

    private initiateSaveContent() {
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
        }, 500, "editor-save");
    }
}