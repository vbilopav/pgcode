define(["require", "exports", "app/controls/context-menu", "app/_sys/storage", "app/_sys/api"], function (require, exports, context_menu_1, storage_1, api_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const storage = new storage_1.default({ connection: null });
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
        constructor(element) {
            element.addClass("footer").html(String.html `
            <div class="connections">
                <span class="icon-database"></span>
                <span class="connections-text"></span>
            </div>
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);
            this.initConnectionsMenu(element.children[0]);
            this.initFeedbackMenu(element.children[1]);
        }
        async initConnectionsMenu(btn) {
            const txt = btn.find(".connections-text");
            const result = await api_1.fetchConnections();
            if (!result.ok) {
                txt.html("¯\\_(ツ)_/¯");
            }
            else {
                if (!storage.connection) {
                    txt.html("Connection not selected");
                    txt.attr("title", "Click here to select from available connections...");
                }
                else {
                }
                const menuItems = new Array();
                for (let connection of result.data.connections) {
                    menuItems.push({ text: connection.name, data: connection.value, action: () => {
                            txt.html(connection.name);
                            txt.attr("title", connection.value);
                        } });
                }
                new FooterContextMenu({
                    id: "conn-footer-menu",
                    event: "click",
                    target: btn,
                    items: menuItems
                });
            }
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