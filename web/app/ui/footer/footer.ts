import { ContextMenu, ContextMenuCtorArgs, ContextMenuItem } from "app/controls/context-menu";
import { AppStatus, IMain } from "app/types";

class FooterContextMenu extends ContextMenu {
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
        return String.html`<div class="footer-menu-item" title="${menuItem.data}">${menuItem.text}</div>`.toElement();
    }
}

export default class  {
    private index: IMain;

    constructor(element: Element, index: IMain) {
        this.index = index;
        index.setStatus(AppStatus.busy);

        element.addClass("footer").html(String.html`
            <div class="connections">
                <span class="icon-database"></span>
                <span class="connections-text">Connection not selected</span>
            </div>
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);

        //let btnConnections = element.children[0];
        

        /*
        new FooterContextMenu({
            id: "conn-footer-menu",
            event: "click",
            target: btnConnections,
            items: [{text: "item1", action: ()=>{}}, {text: "item2", action: ()=>{}}, {text: "item3", action: ()=>{}}, {text: "item4", action: ()=>{}}]
        } as ContextMenuCtorArgs);
        */
        this.initConnectionsMenu(element.children[0]);
        this.initFeedbackMenu(element.children[1]);
    }

    private async initConnectionsMenu(btn: Element) {
        var result = await(await fetch("connections")).json();
        this.index.setStatus(AppStatus.ready);
        console.log(result);
    }

    private initFeedbackMenu(btn: Element) {
        new FooterContextMenu({
            id: "feed-footer-menu",
            event: "click",
            target: btn,
            items: [{
                text: "Open New Issue", 
                data: "Opens a new window to create a new issue on GitHub repository",
                action: ()=> window.open("https://github.com/vbilopav/sfcode/issues/new", "_blank").focus()
            }, {
                text: "Tweet Your Feedback", 
                data: "Opens a new window to send a Tweeter feedback",
                action: () => window.open("https://twitter.com/intent/tweet?text=" + encodeURI("Say something about @pgcode") + "&hashtags=pgcode", "_blank").focus()
            }],
            onOpen: () => btn.html("&#128522;"),
            onClose: () => btn.html("&#128526;")
        } as ContextMenuCtorArgs);
    }
}