import "vs/editor/editor.main";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import {classes} from "app/api";
import {subscribe, SIDEBAR_DOCKED, SPLITTER_CHANGED, SIDEBAR_UNDOCKED} from "app/_sys/pubsub";

export default class {
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

    public dispose() {
        this.monaco.dispose();
    }
    
    public layout() {
        if (!this.content.hasClass(classes.active)) {
            return;
        }
        this.monaco.layout({
            height:  this.container.clientHeight,
            width:  this.container.clientWidth
        });
    }

    public initiateLayout() {
        if (this.layoutTimeout) {
            clearTimeout(this.layoutTimeout);
        }
        this.layoutTimeout = setTimeout(() => this.layout(), 25);
    }
}