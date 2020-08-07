define(["require", "exports", "app/controls/context-menu"], function (require, exports, context_menu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 extends context_menu_1.ContextMenu {
        adjust() {
            this.element.css("top", "0").css("left", "0").visible(false).showElement();
            const target = this.target.getBoundingClientRect();
            const element = this.element.getBoundingClientRect();
            let left;
            if (target.left + element.width >= window.innerWidth) {
                left = window.innerWidth - element.width;
            }
            else {
                left = target.left;
            }
            this.element.css("top", (target.top - element.height) + "px").css("left", left + "px").css("min-width", target.width + "px").visible(true);
        }
        menuElement(id) {
            return String.html `<div id="${id}" class="footer-menu"></div>`.toElement();
        }
        menuItemElement(menuItem) {
            return String.html `
        <div class="footer-menu-item">
            <span>${menuItem.checked ? '&check;' : ""}</span>
            <span>${menuItem.text}</span>
        </div>`.toElement().attr("title", !menuItem.data ? "" : menuItem.data);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=footer-context-menu.js.map