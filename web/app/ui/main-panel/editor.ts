﻿import "vs/editor/editor.main";
import {classes, IScriptContent} from "app/api";
import {SIDEBAR_DOCKED, SIDEBAR_UNDOCKED, SPLITTER_CHANGED, subscribe} from "app/_sys/pubsub";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import ICodeEditorViewState = monaco.editor.ICodeEditorViewState;
import timeout from "app/_sys/timeout";

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
        this.monaco = monaco.editor.create(element as HTMLElement, {
            value: scriptContent ? scriptContent.content : "",
            language,
            theme: "vs-dark",
            renderWhitespace: "all",
            automaticLayout: false
        });
        if (scriptContent && scriptContent.viewState) {
            this.monaco.restoreViewState(JSON.parse(scriptContent.viewState) as ICodeEditorViewState);
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
            this.monaco.restoreViewState(JSON.parse(value.viewState) as ICodeEditorViewState);
        }
        return this;
    }

    private initiateSaveContent() {
        timeout(() => {
            
            //console.log(this.content.dataAttr("data"), this.monaco.getValue(), this.monaco.saveViewState());
            console.log(this.monaco.getValue().hashCode());
            
        }, 1000, "editor-save");
        return this;
    }
}