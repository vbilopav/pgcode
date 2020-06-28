import { subscribe, CLOSE_CONTEXT_MENU } from "app/_sys/pubsub";

interface ContextMenuBase {
    order?: number;
    element?: Element;
}

interface ContextMenuItem extends ContextMenuBase {
    id?: string, 
    text: string, 
    data?: string, 
    checked?: boolean, 
    keyBindingsInfo?: string, 
    args?: any, 
    action?: (args1?: any, args2?: any) => any
}

type MenuItemType = ContextMenuItem | ContextMenuSplitter;

interface ContextMenuSplitter extends ContextMenuBase {
    splitter: boolean
}

interface ContextMenuCtorArgs {
    id: string,
    items: Array<MenuItemType>,
    target: Element | ElementResult,
    event: "contextmenu" | "click",
    menuItemsCallback: (items: Array<MenuItemType>) => Array<MenuItemType>,
    beforeOpen: (menu: ContextMenu, e?: MouseEvent) => boolean,
    onOpen: (menu?: ContextMenu) => any,
    onClose: (menu?: ContextMenu) => any;
}

abstract class ContextMenu {
    public readonly element: Element;
    public readonly target: Element;
    public readonly id: string;

    public args?: any;

    protected items: {[id: string] : MenuItemType};
    protected actions: Element;
    protected abstract menuElement(id: string): Element;
    protected menuSplitterElement(): Element { return new Element() };
    protected abstract menuItemElement(menuItem: ContextMenuItem): Element;
    protected onClose: (menu?: ContextMenu) => any;
    protected event: string;

    constructor({
        id,
        items = [],
        target,
        event = "contextmenu",
        menuItemsCallback = items => items,
        beforeOpen = () => true,
        onOpen = () => {},
        onClose = () => {}
    }: ContextMenuCtorArgs) {
        this.id = id;
        this.element = document.body.find("#" + id);
        if (!(this.element as ElementResult).length) {
            this.element = this.menuElement(id) as ElementResult;
            document.body.append(this.element);
        }
        this.actions = this.getActionsContainerElement(this.element);
        this.onClose = onClose;
        this.event = event;
        this.setMenuItems(items);
        this.element.on("click", () => this.close());
        window.on("resize", () => this.close());
        window.on("mousedown", (e: MouseEvent) => {
            let path = e.composedPath();
            if ((!path.includes(this.element) && !path.includes(this.target) && event === "click") || (!path.includes(this.element) && event !== "click")) {
                this.close();
            }
        }).on("keyup", (e: KeyboardEvent) => {
            if (e.keyCode === 27) {
                this.close();
            }
        });

        this.target = target.on(event, (e: MouseEvent) => {
            if (!beforeOpen(this, e)) {
                return;
            }
            if (Object.keys(this.items).length === 0) {
                return;
            }
            if (this.isVisible) {
                this.close();
                return;
            }
            this.actions.html("");
            for(let item of menuItemsCallback(Object.values(this.items).sort((a, b) => a.order - b.order))) {
                this.actions.append(item.element);
            }
            this.adjust(e);
            e.preventDefault();
            onOpen(this);
        });

        subscribe(CLOSE_CONTEXT_MENU, () => this.close());
    }

    public open() {
        this.target.trigger(this.event);
    }

    public close() : void {
        if (!this.isVisible) {
            return;
        }
        this.element.hideElement();
        this.actions.html("");
        this.onClose(this);
    }

    public getCheckedItem() : ContextMenuItem {
        for(let value of Object.values(this.items)) {
            if ((value as ContextMenuItem).checked) {
                return value as ContextMenuItem;
            }
        }
        return null;
    }

    public triggerById(id: string, args?: any) {
        const item = this.items[id] as ContextMenuItem;
        if (item) {
            item.action(args);
        }
    }

    public clearItems() {
        this.items = {};
    }

    public updateMenuItem(id: string, data: MenuItemType) {
        const item = this.items[id];
        const newItem = {...(item ? item : {}), ...data} as ContextMenuItem;
        this.updateItemElement(newItem);
        if (newItem.id === undefined) {
            newItem.id = id;
        }
        this.items[id] = newItem;
        return this;
    }

    public setMenuItems(items: Array<MenuItemType>) {
        this.clearItems();
        let count = 0;
        for(let item of items) {
            item.order = count++;
            this.updateItemElement(item);
            let menuItem: ContextMenuItem = item as ContextMenuItem;
            this.items[!menuItem.id ? count.toString() : menuItem.id] = item;
        }
    }

    protected adjust(e: MouseEvent) {
        this.element.css("top", e.y + "px").css("left", e.x + "px").visible(false).showElement();

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
        this.element.visible(true);
    }

    protected getActionsContainerElement(element: Element): Element {
        return element;
    }

    protected get isVisible() : boolean {
        if (this.actions.childNodes.length === 1 && this.actions.childNodes[0].nodeType === Node.TEXT_NODE) {
            return false;
        }
        return this.element.css("display") !== "none" && this.actions.childNodes.length !== 0;
    }

    private updateItemElement(item: MenuItemType) {
        let menuItem: ContextMenuItem = item as ContextMenuItem;
        if ((item as ContextMenuSplitter).splitter) {
            item.element = this.menuSplitterElement();
        } else {
            item.element = this.menuItemElement(menuItem).on("click", () => {
                menuItem.action(menuItem.args, this.args);
            });
        }
    }
}

export {ContextMenu, ContextMenuCtorArgs, MenuItemType, ContextMenuItem};
