import "vs/editor/editor.main";
import { subscribe, SPLITTER_CHANGED } from "app/_sys/pubsub";
//import { EditorType } from "app/types";
//import { fetchScriptContent } from "app/api";

export default class  {
    private element: Element;
    private tabs: Element;
    private content: Element;
    private headerHeight: number;
    private headerRows: number = 1;
    private adjustTimeout: number;

    constructor(element: Element){
        this.element = element.addClass("main-panel").html(
            String.html`
                <div></div>
                <div></div>
            `);
        this.tabs = element.children[0];
        this.content = element.children[1];
        this.initHeaderAdjustment();
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
        const tab = (
            String.html`
            <div class="tab">
                <i class="icon-doc-text"></i>
                <span>${title}</span>
                <i class="close" title="close">&#10006</i>
            </div>` as string)
            .toElement()
            .on("click", e => this.tabClick(e))
            .appendElementTo(this.tabs);
        this.activateByTab(tab);
        this.adjustHeaderHeight();
    }

    private activateByTab(tab: Element) {
        this.tabs.children.forEachChild
        for(let t of this.tabs.children) {
            t.removeClass("active");
        }
        tab.addClass("active");
    }

    private removeByTab(tab: Element) {
        //...
    }

    private tabClick(e: Event) {
        const target = e.target as Element;
        if ((target as Element).hasClass("close")) {
            this.removeByTab(target);
            return;
        }
        this.activateByTab(e.currentTarget as Element);
    }
    
    private initHeaderAdjustment() {
        this.headerHeight = Number(this.element.css("grid-template-rows").split(" ")[0].replace("px", ""));
        window.on("resize", () => this.initiateHeaderAdjust());
        subscribe(SPLITTER_CHANGED, () => this.initiateHeaderAdjust());
    }

    private initiateHeaderAdjust() {
        if (this.adjustTimeout) {
            clearTimeout(this.adjustTimeout);
        }
        this.adjustTimeout = setTimeout(() => this.adjustHeaderHeight(), 10);
    }

    private adjustHeaderHeight() {
        if (this.adjustTimeout) {
            clearTimeout(this.adjustTimeout);
        }
        let lastTop: number;
        let rows: number = 1;
        for(let t of this.tabs.children) {
            let top = t.getBoundingClientRect().top;
            if (lastTop != undefined && lastTop < top) {
                rows++;
            }
            lastTop = top;
        }
        if (rows == this.headerRows) {
            return;
        }
        let split = this.element.css("grid-template-rows").split(" ");
        this.element.css("grid-template-rows", `${rows * this.headerHeight}px ${split[1]}`);
        this.headerRows = rows;
        this.adjustTimeout = undefined;
    }
}
