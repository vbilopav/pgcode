import "vs/editor/editor.main";
//import { EditorType } from "app/types";
//import { fetchScriptContent } from "app/api";

export default class  {
    private tabs: Element;
    private content: Element;

    constructor(element: Element){
        element.addClass("main-panel").html(String.html`<div></div><div></div>`);
        this.tabs = element.children[0];
        this.content = element.children[1];

        //console.log("main-panel", element);
        /*
        monaco.editor.create(element as HTMLElement, {
            value: "",
            language: "pgsql",
            theme: "vs-dark",
            renderWhitespace: "all",
            automaticLayout: false
        });
        */
    }

    public async activateScript(id: number, title: string) {
        (String.html`
        <div>
            <i class="icon-doc-text"></i>
            <span>${title}</span>
            <i class="close" title="close">&#10006</i>
        </div>` as string)
        .toElement()
        .appendElementTo(this.tabs);
    }
}
