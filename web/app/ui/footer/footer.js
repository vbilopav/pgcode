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
            return String.html `<div class="footer-menu-item">${menuItem.text}</div>`.toElement().attr("title", menuItem.data);
        }
    }
    class default_1 {
        constructor(element) {
            this.footer = element.addClass("footer").html(String.html `
            <div class="connections">
                <span class="icon-database"></span>
                <span class="connections-text"></span>
            </div>
            <div class="info">PostgreSQL=12.0, Host=localhost, Port=5434, Database=pgcode_test, User=postgres</div>
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);
            this.connections = element.find(".connections");
            this.connectionsText = this.connections.find(".connections-text");
            this.info = element.find(".info");
            this.initConnectionsMenu();
            this.initFeedbackMenu(element.find(".feed"));
        }
        async initConnectionsMenu() {
            const result = await api_1.fetchConnections();
            if (!result.ok) {
                this.connectionsText.html("¯\\_(ツ)_/¯");
            }
            else {
                if (!storage.connection) {
                    this.selectConnection();
                }
                else {
                    const name = storage.connection;
                    const selected = result.data.connections.filter(c => c.name === name);
                    if (!selected.length) {
                        storage.connection = name;
                        this.selectConnection();
                    }
                    else {
                        this.selectConnection(selected[0]);
                    }
                }
                const menuItems = new Array();
                for (let connection of result.data.connections) {
                    menuItems.push({ text: connection.name, data: connection.value, action: () => this.selectConnection(connection) });
                }
                new FooterContextMenu({ id: "conn-footer-menu", event: "click", target: this.connections, items: menuItems });
            }
            console.log(result);
        }
        selectConnection(connection) {
            if (!connection) {
                this.connectionsText.html("Connection not selected");
                this.connectionsText.attr("title", "Click here to select from available connections...");
                this.info.html("");
                this.info.attr("title", "no connection...");
                storage.connection = null;
            }
            else {
                this.connectionsText.html(connection.name);
                this.connectionsText.attr("title", connection.value);
                const parts = connection.value.split(","), part = (idx) => parts[idx].split("=")[1];
                this.info.html(` ${part(0)} | ${part(1)} | ${part(2)} | ${part(3)} | ${part(4)} `);
                this.info.attr("title", connection.value);
                storage.connection = connection.name;
            }
            const rect = this.connections.getBoundingClientRect();
            let columns = this.footer.css("grid-template-columns").split(" ");
            columns[0] = rect.width + "px";
            columns[2] = "auto";
            this.footer.css("grid-template-columns", columns.join(" "));
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