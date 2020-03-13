import "vs/editor/editor.main";
import { subscribe, publish, SPLITTER_CHANGED, TAB_SELECTED, TAB_UNSELECTED, SCHEMA_CHANGED } from "app/_sys/pubsub";
import { createTabElement } from "app/ui/main-panel/tabs";
import { ItemInfoType, Keys, ISchema } from "app/api";

interface Item {
    tab: Element,
    id: string,
    key: Keys,
    timestamp: number,
    data: ItemInfoType
}
const _sticky = "sticky";
const _active = "active";

export default class  {
    private element: Element;
    private tabs: Element;
    private content: Element;
    private headerHeight: number;
    private headerRows: number = 1;
    private adjustTimeout: number;
    private activeTab: Element;
    private stickyTab: Element;
    private items: Map<string, Item> = new Map<string, Item>();

    constructor(element: Element){
        this.element = element.addClass("main-panel").html(
            String.html`
                <div></div>
                <div></div>
            `);
        this.tabs = element.children[0];
        this.content = element.children[1];
        this.initHeaderAdjustment();
        subscribe(SCHEMA_CHANGED, (data: ISchema, name: string) => this.schemaChanged(name, data.connection));
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

    public unstickById(id: string) {
        if (this.stickyTab && this.stickyTab.id == id) {
            this.stickyTab.removeClass(_sticky);
            this.stickyTab = null;
        }
    }

    public activate(id: string, key: Keys, data: ItemInfoType) {
        const item = this.items.get(id);
        if (item) {
            // tab already exists
            this.activateByTab(item.tab);

        } else {
            // create a new tab
            const tab = this.createTabElement(id, key, data);
            if (this.stickyTab) {
                this.items.delete(this.stickyTab.id);
                this.stickyTab.replaceWith(this.makeStickyTab(tab));
            } else {
                this.makeStickyTab(tab).appendElementTo(this.tabs);
            }
            let item = {tab, id, key, data} as Item;
            this.items.set(id, item);
            this.activateByTab(tab, item);
        }
    }

    private schemaChanged(schema: string, connection: string) {
        if (!this.activeTab) {
            return;
        }
        const item = this.items.get(this.activeTab.id);
        if (!item) {
            return;
        }
        setTimeout(() => publish(TAB_SELECTED, item.id, item.key, item.data.schema, item.data.connection), 0);
    }

    private activateByTab(tab: Element, item?: Item) {
        for(let t of this.tabs.children) {
            if (t.hasClass(_active)) {
                t.removeClass(_active);
                let remove = this.items.get(t.id);
                publish(TAB_UNSELECTED, remove.id, remove.key);
            }
        }
        this.activeTab = tab.addClass(_active);
        this.activated(tab.id, item);
        this.initiateHeaderAdjust();
    }

    private activated(id: string, item?: Item) {
        if (!item) {
            item = this.items.get(id);
        }
        item.timestamp = new Date().getTime();
        publish(TAB_SELECTED, item.id, item.key, item.data.schema, item.data.connection);
    }

    private removeByTab(tab: Element) {
        const 
            id = tab.id, 
            active = tab.hasClass(_active), 
            sticky = tab.hasClass(_sticky), 
            item = this.items.get(id);
        this.items.delete(id);
        tab.remove();
        if (sticky) {
            this.stickyTab = null;
        }
        if (!active) {
            return;
        }
        publish(TAB_UNSELECTED, item.id, item.key);
        if (!this.items.size) {
            return;
        }
        let newItem = this.items.maxBy(v => v.timestamp);
        this.activateByTab(newItem.tab, newItem);
    }

    private createTabElement(id: string, key: Keys, data) {
        return createTabElement(id, key, data)
            .on("click", e => this.tabClick(e))
            .on("dblclick", e => this.tabDblClick(e));
    }

    private makeStickyTab(tab: Element) {
        this.stickyTab = tab;
        return tab.addClass(_sticky);
    }

    private tabClick(e: Event) {
        const target = e.target as Element;
        const currentTarget = e.currentTarget as Element;
        if (target.hasClass("close")) {
            this.removeByTab(currentTarget);
            return;
        }
        this.activateByTab(currentTarget);
    }

    private tabDblClick(e: Event) {
        const tab = e.currentTarget as Element;
        if (tab.hasClass(_sticky)) {
            tab.removeClass(_sticky)
            this.stickyTab = null;
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
        if (this.activeTab) {
            if (this.activeTab.dataAttr("row") as number != rows) {
                this.activeTab.addClass("upper-row");
            } else {
                this.activeTab.removeClass("upper-row");
            }
        }
        if (rows != this.headerRows) {
            this.element.css("grid-template-rows", `${rows * this.headerHeight}px auto`);
            this.headerRows = rows;
        }
        this.adjustTimeout = undefined;
    }
}
