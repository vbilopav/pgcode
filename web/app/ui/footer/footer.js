define(["require", "exports", "app/controls/footer-context-menu", "app/controls/monaco-context-menu", "app/_sys/storage", "app/types", "app/_sys/pubsub"], function (require, exports, footer_context_menu_1, monaco_context_menu_1, storage_1, types_1, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const storage = new storage_1.default({ connection: null });
    class default_1 {
        constructor(element) {
            this.selectedConnection = null;
            this.connectionMenu = null;
            this.footer = element.addClass("footer").html(String.html `
            <div class="connections">
                <i class="icon-database"></i>
                <span></span>
            </div>
            <div class="info clickable">
                <img src="favicon.ico" />
                <span></span>
            </div>
            <div class="schema clickable">
                <i class="icon-search"></i>
                <span>public</span>
            </div>
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);
            this.connections = element.find(".connections");
            this.info = element.find(".info");
            this.initFeedbackMenu(element.find(".feed"));
            pubsub_1.subscribe(pubsub_1.API_INITIAL, response => this.initConnectionsMenu(response));
            const hidden = String.html `<input id="hidden" type="text" class="out-of-viewport" />`.
                toElement().
                appendElementTo(document.body);
            new monaco_context_menu_1.default({
                id: "info-ctx-menu",
                target: this.info,
                beforeOpen: menu => {
                    const selection = window.getSelection();
                    const txt = selection.toString();
                    if (!txt) {
                        return false;
                    }
                    if (selection.anchorNode.parentElement.parentElement != this.info && selection.anchorNode != this.info) {
                        return false;
                    }
                    menu.updateMenuItem("copy", {
                        text: `copy "${txt}"`, action: () => {
                            hidden.value = txt;
                            hidden.select();
                            document.execCommand("copy");
                        }
                    });
                    return true;
                }
            });
        }
        initConnectionsMenu(response) {
            if (!response.ok) {
                this.connections.find("span").html("¯\\_(ツ)_/¯");
            }
            else {
                if (response.data.connections.length === 1) {
                    this.selectConnection(response.data.connections[0]);
                    this.connections.css("cursor", "initial");
                }
                else {
                    const menuItems = new Array();
                    for (let connection of response.data.connections) {
                        menuItems.push({
                            id: connection.name,
                            text: connection.name,
                            data: this.formatTitleFromConn(connection),
                            action: () => this.selectConnection(connection)
                        });
                    }
                    this.connectionMenu = new footer_context_menu_1.default({
                        id: "conn-footer-menu",
                        event: "click",
                        target: this.connections,
                        items: menuItems
                    });
                    if (!storage.connection) {
                        this.selectConnection();
                    }
                    else {
                        const name = storage.connection;
                        const selected = response.data.connections.filter(c => c.name === name);
                        if (!selected.length) {
                            storage.connection = name;
                            this.selectConnection();
                        }
                        else {
                            this.selectConnection(selected[0]);
                        }
                    }
                }
            }
        }
        selectConnection(connection) {
            if (this.selectedConnection === connection) {
                return;
            }
            this.selectedConnection = connection;
            const name = (connection ? connection.name : null);
            if (!connection) {
                this.connections.find("span").html("Connection not selected").attr("title", "Click here to select from available connections...");
                this.info.find("span").html("");
                this.info.attr("title", "no connection...");
                storage.connection = null;
                pubsub_1.publish(pubsub_1.SET_APP_STATUS, types_1.AppStatus.NO_CONNECTION);
            }
            else {
                const title = this.formatTitleFromConn(connection);
                this.connections.find("span").html(name).attr("title", title);
                this.info.find("span").html(`v${connection.version}&nbsp;&nbsp;//${connection.user}@${connection.host}:${connection.port}/${connection.database}`);
                this.info.attr("title", title);
                if (this.connectionMenu) {
                    let old = storage.connection;
                    if (old) {
                        this.connectionMenu.updateMenuItem(old, { checked: false });
                    }
                    this.connectionMenu.updateMenuItem(name, { checked: true });
                }
                storage.connection = name;
                pubsub_1.publish(pubsub_1.SET_APP_STATUS, types_1.AppStatus.READY, name);
            }
            const columns = this.footer.css("grid-template-columns").split(" ");
            columns[0] = this.connections.getBoundingClientRect().width + "px";
            columns[1] = this.info.getBoundingClientRect().width + "px";
            columns[3] = "auto";
            this.footer.css("grid-template-columns", columns.join(" "));
        }
        formatTitleFromConn(connection) {
            return `PostgreSQL ${connection.version}\nHost: ${connection.host}\nPort: ${connection.port}\nDatabase: ${connection.database}\nUser: ${connection.user}`;
        }
        initFeedbackMenu(btn) {
            new footer_context_menu_1.default({
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