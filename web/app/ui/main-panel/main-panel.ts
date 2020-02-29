import "vs/editor/editor.main";
import { subscribe, publish, SPLITTER_CHANGED, TAB_SELECTED } from "app/_sys/pubsub";
import { Keys } from "app/types";
import { fetchScriptContent, IScriptInfo, ScriptId } from "app/api";

interface Item {
    tab: Element;
    id: string;
    key: Keys
}

const _items: Record<string, Item> = {};
let _activeTab: Element;
let _sticky: Element;

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

    public async activateScript(script: IScriptInfo) {
        const id = ScriptId(script.id);
        const item = _items[id];
        if (item) {
            // tab already exists
            this.activateByTab(item.tab);

        } else {
            // create a new tab
            const tab = this.createTabElement("icon-doc-text", script.title, id);
            if (_sticky) {
                delete _items[_sticky.id];
                _sticky.replaceWith(this.sticky(tab));
            } else {
                this.sticky(tab).appendElementTo(this.tabs);
            }
            _items[id] = {tab, id, key: Keys.SCRIPTS};
            this.activateByTab(tab);
        }
    }

    private activateByTab(tab: Element) {
        for(let t of this.tabs.children) {
            t.removeClass("active");
        }
        _activeTab = tab.addClass("active");
        this.activated(tab.id);
        this.initiateHeaderAdjust();
    }

    private activated(id: string) {
        let item = _items[id];
        publish(TAB_SELECTED, item.id, item.key);
    }

    private removeByTab(tab: Element) {
        //...
    }

    private createTabElement(iconClass: string, title: string, key: string) {
        return (String.html`
        <div class="tab">
            <i class=${iconClass}></i>
            <span class="title">${title}</span>
            <i class="close" title="close">&#10006</i>
        </div>` as string)
        .toElement()
        .attr("id", key)
        .on("click", e => this.tabClick(e))
        .on("dblclick", e => this.tabDblClick(e));
    }

    private sticky(tab: Element) {
        _sticky = tab;
        return tab.addClass("sticky");
    }

    private tabClick(e: Event) {
        const target = e.target as Element;
        if ((target as Element).hasClass("close")) {
            this.removeByTab(target);
            return;
        }
        this.activateByTab(e.currentTarget as Element);
    }

    private tabDblClick(e: Event) {
        const tab = e.currentTarget as Element;
        if (tab.hasClass("sticky")) {
            tab.removeClass("sticky")
            _sticky = null;
        }
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
            t.dataAttr("row", rows);
        }
        if (_activeTab) {
            if (_activeTab.dataAttr("row") as number != rows) {
                _activeTab.addClass("upper-row");
            } else {
                _activeTab.removeClass("upper-row");
            }
        }
        if (rows != this.headerRows) {
            this.element.css("grid-template-rows", `${rows * this.headerHeight}px auto`);
            this.headerRows = rows;
        }
        this.adjustTimeout = undefined;
    }
}
