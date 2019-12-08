import { subscribe, CLOSE_CONTEXT_MENU } from "app/_sys/pubsub";

interface ContextMenuBase {
    element?: Element
}

interface ContextMenuItem extends ContextMenuBase {
    id?: string, 
    text: string, 
    keyBindingsInfo?: string, 
    args?: any, 
    action: (args?: any) => any
}

interface ContextMenuSplitter extends ContextMenuBase {
    splitter: boolean
}

interface ContextMenuCtorArgs {
    id: string,
    items: Array<ContextMenuItem | ContextMenuSplitter>,
    target: Element,
    menuItemsCallback: (items: Array<ContextMenuItem | ContextMenuSplitter>) => Array<ContextMenuItem | ContextMenuSplitter>
}

abstract class ContextMenu {

    protected items: Array<ContextMenuItem | ContextMenuSplitter>;
    protected abstract menuElement(id: string): Element;
    protected abstract menuSplitterElement(): Element;
    protected abstract menuItemElement(text: string, keyBindingsInfo?: string): Element

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
        const container = element.find(".actions-container");
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
            item.element = this.menuItemElement(menuItem.text, menuItem.keyBindingsInfo).on("click", () => {
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
        // TODO: compensate for different themes e.g. vs-dark, vs-light
        return String.html`
            <div id="${id}" class="vs-dark" style="display: none; position: absolute;">
                <div class="context-view monaco-menu-container" aria-hidden="false">
                    <div class="monaco-menu">
                        <div class="monaco-action-bar animated vertical">
                            <ul class="actions-container" role="menubar"></ul>
                        </div>
                    </div>
                </div>
            </div>
        `.toElement();
    }

    protected menuSplitterElement(): Element {
        return String.html`
            <li class="action-item disabled" role="presentation">
                <a class="action-label icon separator disabled" role="presentation"></a>
            </li>`.toElement();
    }
    
    protected menuItemElement(text: string, keyBindingsInfo?: string): Element {
        return String.html`
            <li class="action-item" role="presentation">
                <a class="action-label" role="menuitem" tabindex="0">${text}</a>
                ${keyBindingsInfo ? `<span class="keybinding">${keyBindingsInfo}</span>` : ""}
            </li>`.toElement();
    }
}

export {MonacoContextMenu, ContextMenuCtorArgs};