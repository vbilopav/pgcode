import "vs/editor/editor.main";
import {classes} from "app/api";
import {SIDEBAR_DOCKED, SIDEBAR_UNDOCKED, SPLITTER_CHANGED, subscribe} from "app/_sys/pubsub";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import ICodeEditorViewState = monaco.editor.ICodeEditorViewState;

export interface IEditor {
    dispose(): IEditor;
    layout(): IEditor;
    initiateLayout(): IEditor;
    focus(): IEditor;
    setValues(value: string, viewState: string) : IEditor;
}

export const nullEditor = new (class implements IEditor {
    dispose() {return this}
    initiateLayout() {return this}
    layout() {return this}
    focus() {return this}
    setValues(value: string, viewState: string) {return this}
})();

export class Editor implements IEditor {
    private monaco: IStandaloneCodeEditor;
    private readonly content: Element;
    private container: Element;
    private layoutTimeout: number;
    
    constructor(container: Element, content: Element, language: string) {
        this.container = container;
        this.content = content;
        const element = String.html`<div style="position: fixed;"></div>`.toElement();
        this.container.append(element);
        this.monaco = monaco.editor.create(element as HTMLElement, {
            value: "",
            language,
            theme: "vs-dark",
            renderWhitespace: "all",
            automaticLayout: false
        });

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

    setValues(value: string, viewState: string) {
        this.monaco.setValue(value);
        if (viewState) {
            this.monaco.restoreViewState(JSON.parse(viewState) as ICodeEditorViewState);
        }
        return this;
    }
}