define(["require", "exports", "app/controls/context-menu", "app/types"], function (require, exports, context_menu_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FooterContextMenu extends context_menu_1.ContextMenu {
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
            return String.html `<div class="footer-menu-item" title="${menuItem.data}">${menuItem.text}</div>`.toElement();
        }
    }
    class default_1 {
        constructor(element, index) {
            this.index = index;
            index.setStatus(types_1.AppStatus.busy);
            element.addClass("footer").html(String.html `
            <div class="connections">
                <span class="icon-database"></span>
                <span class="connections-text">Connection not selected</span>
            </div>
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);
            this.initConnectionsMenu(element.children[0]);
            this.initFeedbackMenu(element.children[1]);
        }
        async initConnectionsMenu(btn) {
            var result = await (await fetch("connections")).json();
            this.index.setStatus(types_1.AppStatus.ready);
            console.log(result);
        }
        initFeedbackMenu(btn) {
            new FooterContextMenu({
                id: "feed-footer-menu",
                event: "click",
                target: btn,
                items: [{
                        text: "Open New Issue",
                        data: "Opens a new window to create a new issue on GitHub repository",
                        action: () => window.open("https://github.com/vbilopav/sfcode/issues/new", "_blank").focus()
                    }, {
                        text: "Tweet Your Feedback",
                        data: "Opens a new window to send a Tweeter feedback",
                        action: () => window.open("https://twitter.com/intent/tweet?text=" + encodeURI("Say something about @pgcode") + "&hashtags=pgcode", "_blank").focus()
                    }],
                onOpen: () => btn.html("&#128522;"),
                onClose: () => btn.html("&#128526;")
            });
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=footer.js.map