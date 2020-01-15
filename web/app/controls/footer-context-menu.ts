import { ContextMenu, ContextMenuItem } from "./context-menu";

export default class extends ContextMenu {
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
        this.element.css("top", (target.top - element.height) + "px").css("left", left + "px").css("min-width", target.width + "px").visible(true);
    }

    protected menuElement(id: string): Element {
        return String.html`<div id="${id}" class="footer-menu"></div>`.toElement();
    }

    protected menuItemElement(menuItem: ContextMenuItem): Element {
        return String.html`
        <div class="footer-menu-item">
            <span>${menuItem.checked ? '&check;' : ""}</span>
            <span>${menuItem.text}</span>
        </div>`.toElement().attr("title", menuItem.data);
    }
}
