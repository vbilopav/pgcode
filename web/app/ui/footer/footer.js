define(["require", "exports", "app/controls/footer-context-menu", "app/controls/monaco-context-menu", "app/_sys/storage", "app/api", "app/_sys/pubsub"], function (require, exports, footer_context_menu_1, monaco_context_menu_1, storage_1, api_1, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const storage = new storage_1.default({ connection: null });
    class default_1 {
        constructor(element) {
            this.selectedConnection = null;
            this.connectionMenu = null;
            this.schemasMenu = null;
            this.footer = element.addClass("footer").html(String.html `
            <div class="connections">
                <i class="icon-database"></i>
                <span></span>
            </div>
            <div class="info clickable">
                <img src="favicon.ico" />
                <span></span>
            </div>
            <div class="schemas clickable">
                <i class="icon-search"></i>
                <span></span>
            </div>
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);
            this.initConnections(element);
            this.initInfo(element);
            this.initFeedbackMenu(element);
        }
        initConnections(element) {
            this.connections = element.find(".connections");
            this.schemas = element.find(".schemas");
            pubsub_1.subscribe(pubsub_1.API_INITIAL, response => {
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
                        this.schemasMenu = new footer_context_menu_1.default({
                            id: "schema-footer-menu",
                            event: "click",
                            target: this.schemas,
                            items: []
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
            });
        }
        initInfo(element) {
            this.info = element.find(".info");
            const hidden = String.html `<input id="footer-copy" type="text" class="out-of-viewport" />`.
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
                            hidden.value = "";
                        }
                    });
                    return true;
                }
            });
        }
        initFeedbackMenu(element) {
            const btn = element.find(".feed");
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
        async selectConnection(connection) {
            if (this.selectedConnection === connection) {
                return;
            }
            this.selectedConnection = connection;
            const name = (connection ? connection.name : null);
            if (!connection) {
                this.connections.find("span").html("Connection not selected").attr("title", "Click here to select from available connections...");
                this.info.find("span").html("");
                this.info.attr("title", "no connection...");
                this.schemas.showElement(false);
                this.adjustWidths();
                storage.connection = null;
                pubsub_1.publish(pubsub_1.SET_APP_STATUS, api_1.AppStatus.NO_CONNECTION);
            }
            else {
                const title = this.formatTitleFromConn(connection);
                this.info.visible(false);
                this.schemas.visible(false);
                this.connections.find("span").html(name).attr("title", title);
                this.info.find("span").html(`v${connection.version}&nbsp;&nbsp;//&nbsp;&nbsp;${connection.user}@${connection.host}:${connection.port}/${connection.database}`);
                this.info.attr("title", title);
                this.adjustWidths();
                this.info.visible(true);
                this.schemas.visible(true);
                if (this.connectionMenu) {
                    const checked = this.connectionMenu.getCheckedItem();
                    if (checked) {
                        this.connectionMenu.updateMenuItem(checked.id, { checked: false });
                    }
                    this.connectionMenu.updateMenuItem(name, { checked: true });
                }
                storage.connection = name;
                const response = await api_1.fetchConnection(name);
                if (response.ok) {
                    const menuItems = new Array();
                    for (let schema of response.data.schemas.names) {
                        menuItems.push({
                            id: schema,
                            text: schema,
                            checked: response.data.schemas.selected === schema,
                            action: () => {
                                this.selectSchema(schema);
                                this.fetchSchema(schema);
                            }
                        });
                    }
                    this.schemasMenu.setMenuItems(menuItems);
                    this.schemas.showElement().find("span").html(response.data.schemas.selected);
                    this.selectSchema(response.data.schemas.selected);
                    pubsub_1.publish(pubsub_1.SCHEMA_CHANGED, response.data, response.data.schemas.selected);
                    pubsub_1.publish(pubsub_1.SET_APP_STATUS, api_1.AppStatus.READY, name);
                }
            }
            this.adjustWidths();
        }
        selectSchema(name) {
            const checked = this.schemasMenu.getCheckedItem();
            if (checked) {
                this.schemasMenu.updateMenuItem(checked.id, { checked: false });
            }
            else {
                if (checked.id === name) {
                    return;
                }
            }
            this.schemasMenu.updateMenuItem(name, { checked: true });
            this.schemas.showElement().find("span").html(name);
        }
        async fetchSchema(name) {
            const response = await api_1.fetchSchema(name);
            pubsub_1.publish(pubsub_1.SCHEMA_CHANGED, response.data, response.data.name);
            pubsub_1.publish(pubsub_1.SET_APP_STATUS, api_1.AppStatus.READY);
        }
        adjustWidths() {
            const columns = this.footer.css("grid-template-columns").split(" ");
            columns[0] = this.connections.getBoundingClientRect().width + "px";
            columns[1] = this.info.getBoundingClientRect().width + "px";
            columns[2] = this.schemas.getBoundingClientRect().width + "px";
            columns[3] = "auto";
            this.footer.css("grid-template-columns", columns.join(" "));
        }
        formatTitleFromConn(connection) {
            return `PostgreSQL ${connection.version}\nHost: ${connection.host}\nPort: ${connection.port}\nDatabase: ${connection.database}\nUser: ${connection.user}`;
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=footer.js.map