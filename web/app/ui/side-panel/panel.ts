import { subscribe, publish, SCHEMA_CHANGED, ITEM_COUNT_CHANGED, TAB_SELECTED, TAB_UNSELECTED } from "app/_sys/pubsub";
import MainPanel from "app/ui/main-panel/main-panel";
import { ISchema, ISidePanel, Keys, classes, ItemContentArgs } from "app/api";
import MonacoContextMenu from "app/controls/monaco-context-menu";
import { ContextMenuCtorArgs, MenuItemType } from "app/controls/context-menu";
import {timeout} from "app/_sys/timeout";

class PanelMenu extends MonacoContextMenu {
    protected adjust() {
        this.element.css("top", "0").css("left", "0").visible(false).showElement();
        const target = this.target.getBoundingClientRect();
        const element = this.element.getBoundingClientRect();
        let left: number;
        if (target.left + element.width >= window.innerWidth) {
            left = window.innerWidth - element.width;
        } else {
            left = target.left;
        }
        this.element.css("top", (target.top + target.height) + "px").css("left", left + "px").css("min-width", target.width + "px").visible(true);
    }
}

export default abstract class Panel {
    protected readonly key: Keys;
    protected readonly element: Element;
    protected readonly header: Element;
    protected readonly items: Element;
    protected mainPanel: MainPanel;
    protected sidePanel: ISidePanel;
    
    protected constructor(element: Element, key: Keys, menuItems: Array<MenuItemType> = []){
        this.element = element;
        this.key = key;
        this.header = element.children[0].html(String.html`
            <div>${key.toUpperCase()}</div>
            <div>
                <span class="btn"><i class="icon-menu"></i></span>
            </div>
        `);
        this.items = element.children[1];
        this.initiateToggleShadow();
        this.initPanelMenu(menuItems);
        this.items.on("click", e => this.itemsClick(e));
        this.items.on("dblclick", e => this.itemsDblClick(e));
        
        subscribe(SCHEMA_CHANGED, (data: ISchema, name: string) => this.schemaChanged(data, name));
        subscribe(TAB_SELECTED, (id: string) => this.selectItemByElement(this.items.find(`#${id}`), false));
        subscribe(TAB_UNSELECTED, (id: string) => this.unselectItemByElement(this.items.find(`#${id}`), false));
    }

    public show(state: boolean) {
        this.element.showElement(state);
    }

    public setMainPanelRef(mainPanel: MainPanel) {
        this.mainPanel = mainPanel;
        return this;
    }

    public setSidePanelRef(sidePanel: ISidePanel) {
        this.sidePanel = sidePanel;
        return this;
    }

    public unselectAll() {
        const active = this.items.findAll(".active");
        if (active.length > 0) {
            for(let unselect of active) {
                this.unselectItemByElement(unselect as Element);
            } 
        }
    }

    protected createItemElement(content: string) {
        return String.html`
        <div class="panel-item">
            ${content}
        </div>`
        .toElement() as Element
    }

    protected abstract schemaChanged(data: ISchema, name: string) : void;

    protected itemSelected(element: Element, contentArgs = ItemContentArgs) : void {};

    protected itemUnselected(element: Element) : void {};

    protected publishLength() {
        publish(ITEM_COUNT_CHANGED, this.key, this.items.children.length);
    }

    protected selectItemByElement(element: Element, emitEvents = true, contentArgs = ItemContentArgs) {
        if ((element as ElementResult).length === 0) {
            return;
        }
        element.addClass(classes.active);
        if (emitEvents) {
            this.itemSelected(element, contentArgs);
        }
        if (this.items.overflownY()) {
            const elementRect = element.getClientRects();
            const itemsRect = this.items.getClientRects();
            if (elementRect[0].top < itemsRect[0].top) {
                element.scrollIntoView({behavior: "instant", block: "start", inline: "start"} as any as ScrollIntoViewOptions)
            }
            if (elementRect[0].top + elementRect[0].height > itemsRect[0].top + itemsRect[0].height) {
                element.scrollIntoView({behavior: "instant", block: "end", inline: "end"} as any as ScrollIntoViewOptions);
            }
        }
    }

    private itemsClick(e: Event){
        const element = (e.target as Element).closest("div.panel-item");
        if (!element) {
            return;
        }
        if (element.hasClass(classes.active)) {
            return
        }
        this.sidePanel.unselectAll();
        this.selectItemByElement(element, true);
    }

    private itemsDblClick(e: Event){
        const element = (e.target as Element).closest("div.panel-item");
        this.mainPanel.unstickById(element.id);
    }
    
    private unselectItemByElement(element: Element, emitEvents = true) {
        element.removeClass(classes.active);
        if (emitEvents) {
            this.itemUnselected(element);
        }
    }

    private initPanelMenu(menuItems: Array<MenuItemType> = []) {
        if (menuItems.length) {
            new PanelMenu({
                id: `${this.key}-panel-menu`,
                target: this.header.find(".btn"),
                event: "click",
                items: menuItems,
                onOpen: menu => menu.target.addClass(classes.active),
                onClose: menu => menu.target.removeClass(classes.active)
            } as ContextMenuCtorArgs);
        } else {
            this.header.find(".btn").remove();
        }
    }

    private initiateToggleShadow() {
        this.items.on("mouseleave", event => {
            let e = (event.target as Element);
            e.css("overflow-y", "hidden").css("z-index", "");
        }).on("mouseenter", event => {
            let e = (event.target as Element);
            if (e.scrollHeight > e.clientHeight) {
                e.css("overflow-y", "scroll").css("z-index", "1");
            }
        }).on("scroll", () => this.toggleHeaderShadow());
        this.toggleHeaderShadow();
    }

    private toggleHeaderShadow() {
        timeout(() => {
            if (this.items.scrollHeight > this.items.clientHeight && this.items.scrollTop) {
                this.header.addClass("shadow");
            } else {
                this.header.removeClass("shadow");
            }
        }, 10, "panel-scroll");
    }
}