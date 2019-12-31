define(["require", "exports", "app/controls/context-menu"], function (require, exports, context_menu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FooterContextMenu extends context_menu_1.ContextMenu {
        adjust() {
            const target = this.target.getBoundingClientRect();
            const element = this.element.getBoundingClientRect();
            let left;
            if (target.left + element.width > window.innerWidth) {
                left = window.innerWidth - element.width;
            }
            else {
                left = target.left;
            }
            this.element.css("top", (target.top - element.height) + "px").css("left", left + "px").css("min-width", target.width + "px");
        }
        menuElement(id) {
            return String.html `<div id="${id}" class="footer-menu"></div>`.toElement();
        }
        menuItemElement(menuItem) {
            return String.html `<div class="footer-menu-item">${menuItem.text}</div>`.toElement();
        }
    }
    class default_1 {
        constructor(element) {
            element.addClass("footer").html(String.html `
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
                items: [{ text: "item1", action: () => { } }, { text: "item2", action: () => { } }, { text: "item3", action: () => { } }, { text: "item4", action: () => { } }]
            });
            new FooterContextMenu({
                id: "feed-footer-menu",
                event: "click",
                target: btnFeed,
                items: [{
                        text: "Open New Issue",
                        action: () => window.open("https://github.com/vbilopav/sfcode/issues/new", "_blank").focus()
                    }, {
                        text: "Tweet Your Feedback",
                        action: () => window.open("https://twitter.com/intent/tweet?text=" + encodeURI("Say something about @pgcode") + "&hashtags=pgcode", "_blank").focus()
                    }],
                onOpen: () => btnFeed.html("&#128522;"),
                onClose: () => btnFeed.html("&#128526;")
            });
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=footer.js.map