import { subscribe, CLOSE_CONTEXT_MENU } from "app/_sys/pubsub";

interface ContextMenuBase {
    element?: Element
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
    menuItemsCallback: (items: Array<MenuItemType>) => Array<MenuItemType>
}

abstract class ContextMenu {

    protected items: Array<MenuItemType>;
    protected abstract menuElement(id: string): Element;
    protected abstract menuSplitterElement(): Element;
    protected abstract menuItemElement(menuItem: ContextMenuItem): Element

    constructor({
        id,
        items,
        target,
        menuItemsCallback = items => items,
    }: ContextMenuCtorArgs) {

        this.items = items;
        let element = document.body.find("#" + id);
        if (!element.length) {
            element = this.menuElement(id) as ElementResult;
            document.body.append(element);
        }
        const container = element.find("ul");
        const splitter = this.menuSplitterElement();
        const clear = () => {
            element.hideElement();
            container.html("");
        };

        for(let item of this.items) {
            let menuItem: ContextMenuItem = item as ContextMenuItem;
            if ((item as ContextMenuSplitter).splitter) {
                item.element = splitter;
                continue;
            } 
            item.element = this.menuItemElement(menuItem).on("click", () => {
                menuItem.action(menuItem.args);
            });
        }
        

        element.on("click", () => clear());
        window.on("resize", () => clear());

        window.on("mousedown", () => {
            if (!element.find(":hover").length) {
                clear();
            }
        }).on("keyup", (e: KeyboardEvent) => {
            if (e.keyCode === 27) {
                clear();
            }
        });

        target.on("contextmenu", (e: MouseEvent) => {
            container.html("");
            for(let item of menuItemsCallback(items)) {
                container.append(item.element);
            }
            ((element.css("top", e.y + "px") as Element).css("left", e.x + "px") as Element).showElement();
            const
                rect = container.getBoundingClientRect(),
                winWidth = window.innerWidth,
                winHeight = window.innerHeight,
                right = e.x + rect.width,
                bottom = rect.top + rect.height;
            
            if (right >= winWidth) {
                element.css("left", (winWidth - rect.width - 1) + "px");
            }
            if (bottom >= winHeight) {
                element.css("top", (e.y - rect.height - 1) + "px");
            }
            e.preventDefault();
        });

        subscribe(CLOSE_CONTEXT_MENU, () => clear());
    }

    public triggerById(id: string, args?: any) {
        for(let item of this.items as Array<ContextMenuItem>) {
            if (item.id === id) {
                item.action(args);
            }
        }
    }
}

class MonacoContextMenu extends ContextMenu {

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

export {MonacoContextMenu, ContextMenuCtorArgs, MenuItemType };
