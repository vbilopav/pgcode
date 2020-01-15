import { ContextMenu, ContextMenuItem } from "./context-menu";

export default class extends ContextMenu {
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
            ${menuItem.keyBindingsInfo ? '<span class="keybinding">' + menuItem.keyBindingsInfo + '</span>' : ""}
        </li>`.toElement();
    }
}
