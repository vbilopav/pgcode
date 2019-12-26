import { ContextMenu, ContextMenuCtorArgs, ContextMenuItem } from "app/controls/context-menu";

class FooterContextMenu extends ContextMenu {
    protected adjust() {
        const target = this.target.getBoundingClientRect();
        const element = this.element.getBoundingClientRect();
        (this.element.css("top", (target.top - element.height) + "px") as Element).css("left", target.left + "px");
    }

    protected menuElement(id: string): Element {
        return String.html`
        <div id="${id}" class="footer-menu">
        </div>`.toElement();
    }

    protected menuItemElement(menuItem: ContextMenuItem): Element {
        return String.html`
        <div class="footer-menu-item">
            ${menuItem.text}
        </div>`.toElement();
    }
}

export default class  {
    constructor(element: Element) {
        element.addClass("footer").html(String.html`
            <div class="connections">
                <span class="icon-database"></span>
                <span class="connections-text">Connection not selected</span>
            </div>
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);

        let btnConnections = element.children[0];
        let btnFeed = element.children[1];

        new FooterContextMenu({
            id: "conn-footer-menu",
            event: "click",
            target: btnConnections,
            items: [{text: "item1"}, {text: "item2"}, {text: "item3"}, {text: "item4"}]
        } as ContextMenuCtorArgs);
    }
}