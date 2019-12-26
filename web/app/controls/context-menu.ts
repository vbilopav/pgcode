import { subscribe, CLOSE_CONTEXT_MENU } from "app/_sys/pubsub";

interface ContextMenuBase {
    order?: number;
    element?: Element;
}

interface ContextMenuItem extends ContextMenuBase {
    id?: string, 
    text: string, 
    checked?: boolean, 
    keyBindingsInfo?: string, 
    args?: any, 
    action: (args?: any) => any
}

type MenuItemType = ContextMenuItem | ContextMenuSplitter;

interface ContextMenuSplitter extends ContextMenuBase {
    splitter: boolean
}

interface ContextMenuCtorArgs {
    id: string,
    items: Array<MenuItemType>,
    target: Element,
    event: "contextmenu" | "click",
    menuItemsCallback: (items: Array<MenuItemType>) => Array<MenuItemType>
}

abstract class ContextMenu {

    protected items: {[id: string] : MenuItemType};
    protected element: Element;
    protected actions: Element;
    protected target: Element;
    protected abstract menuElement(id: string): Element;
    protected menuSplitterElement(): Element { return new Element() };
    protected abstract menuItemElement(menuItem: ContextMenuItem): Element;

    constructor({
        id,
        items,
        target,
        event = "contextmenu",
        menuItemsCallback = items => items,
    }: ContextMenuCtorArgs) {

        this.element = document.body.find("#" + id);
        if (!(this.element as ElementResult).length) {
            this.element = this.menuElement(id) as ElementResult;
            document.body.append(this.element);
        }
        this.actions = this.getActionsContainerElement(this.element);
        const clear = () => {
            if (this.isVisible) {
                this.element.hideElement();
                this.actions.html("");
            }
        };

        this.items = {};
        let count = 0;
        for(let item of items) {
            item.order = count++;
            this.updateItemElement(item);
            let menuItem: ContextMenuItem = item as ContextMenuItem;
            this.items[!menuItem.id ? count.toString() : menuItem.id] = item;
        }

        this.element.on("click", () => clear());
        window.on("resize", () => clear());
        let skipOpen = false;
        window.on("mousedown", () => {
            if (!this.element.find(":hover").length) {
                if (this.target.find(":hover").length && this.isVisible && event === "click") {
                    skipOpen = true;
                }
                clear();
            }
        }).on("keyup", (e: KeyboardEvent) => {
            if (e.keyCode === 27) {
                clear();
            }
        });

        this.target = target.on(event, (e: MouseEvent) => {
            if (skipOpen) {
                skipOpen = false;
                return;
            }
            this.actions.html("");
            for(let item of menuItemsCallback(Object.values(this.items).sort((a, b) => a.order - b.order))) {
                this.actions.append(item.element);
            }
            ((this.element.css("top", e.y + "px") as Element).css("left", e.x + "px") as Element).showElement();
            this.adjust(e);
            e.preventDefault();
        });

        subscribe(CLOSE_CONTEXT_MENU, () => clear());
    }

    public triggerById(id: string, args?: any) {
        const item = this.items[id] as ContextMenuItem;
        if (item) {
            item.action(args);
        }
    }

    public updateMenuItem(id: string, data: {}) {
        const item = this.items[id];
        const newItem = {...(item ? item : {}), ...data} as ContextMenuItem;
        this.updateItemElement(newItem);
        this.items[id] = newItem;
        return this;
    }

    protected adjust(e: MouseEvent) {
        const
            rect = this.actions.getBoundingClientRect(),
            winWidth = window.innerWidth,
            winHeight = window.innerHeight,
            right = e.x + rect.width,
            bottom = rect.top + rect.height;
        
        if (right >= (winWidth + 1)) {
            let left = (winWidth - rect.width - 1);
            this.element.css("left", (left > 0 ? left : 0) + "px");
        }
        if (bottom >= (winHeight + 1)) {
            let top = e.y - rect.height - 1;
            this.element.css("top", (top > 0 ? top : 0) + "px");
        }
    }

    protected getActionsContainerElement(element: Element): Element {
        return element;
    }

    protected get isVisible() : boolean {
        return this.element.css("display") !== "none";
    }

    private updateItemElement(item: MenuItemType) {
        let menuItem: ContextMenuItem = item as ContextMenuItem;
        if ((item as ContextMenuSplitter).splitter) {
            item.element = this.menuSplitterElement();
        } else {
            item.element = this.menuItemElement(menuItem).on("click", () => {
                menuItem.action(menuItem.args);
            });
        }
    }
}

class MonacoContextMenu extends ContextMenu {
    protected getActionsContainerElement(element: Element): Element {
        return element.find("ul");
    }

    protected menuElement(id: string): Element {
        return String.html`
        <div id="${id}" style="display: none; position: fixed;">
            <div class="context-view monaco-menu-container pgmenu-container ">
                <div class="monaco-menu">
                    <div class="monaco-action-bar animated vertical">
                        <ul class="actions-container"></ul>
                    </div>
                </div>
            </div>
        </div>`.toElement();
    }

    protected menuSplitterElement(): Element {
        return String.html`
        <li class="action-item pgaction disabled">
            <a class="action-label icon separator disabled"></a>
        </li>`.toElement();
    }
    
    protected menuItemElement(menuItem: ContextMenuItem): Element {
        return String.html`
        <li class="action-item pgaction">
            ${menuItem.checked ? '<span class="checked">&check;</span>' : ""}
            <a class="action-label" tabindex="0">${menuItem.text}</a>
            ${menuItem.keyBindingsInfo ? '<span class="keybinding">'  + menuItem.keyBindingsInfo + '</span>' : ""}
        </li>`.toElement();
    }
}

export {ContextMenu, MonacoContextMenu, ContextMenuCtorArgs, MenuItemType, ContextMenuItem};
