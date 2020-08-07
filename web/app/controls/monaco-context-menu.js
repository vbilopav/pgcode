define(["require", "exports", "app/controls/context-menu"], function (require, exports, context_menu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 extends context_menu_1.ContextMenu {
        getActionsContainerElement(element) {
            return element.find("ul");
        }
        menuElement(id) {
            return String.html `
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
        menuSplitterElement() {
            return String.html `
        <li class="action-item pgaction disabled">
            <a class="action-label icon separator disabled"></a>
        </li>`.toElement();
        }
        menuItemElement(menuItem) {
            return String.html `
        <li class="action-item pgaction">
            ${menuItem.checked ? '<span class="checked">&check;</span>' : ""}
            <a class="action-label" tabindex="0">${menuItem.text}</a>
            ${menuItem.keyBindingsInfo ? '<span class="keybinding">' + menuItem.keyBindingsInfo + '</span>' : ""}
        </li>`.toElement();
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=monaco-context-menu.js.map