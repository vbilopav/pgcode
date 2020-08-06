define(["require", "exports", "app/controls/footer-context-menu", "app/controls/monaco-context-menu", "app/_sys/storage", "app/api", "app/_sys/pubsub", "app/ui/content/content", "app/ui/main-panel/main-panel"], function (require, exports, footer_context_menu_1, monaco_context_menu_1, storage_1, api_1, pubsub_1, content_1, main_panel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const storage = new storage_1.default({ connection: null });
    class default_1 {
        constructor(element) {
            this.selectedConnection = null;
            this.connectionMenu = null;
            this.schemasMenu = null;
            this.msgMode = false;
            this.footer = element.addClass("footer").html(String.html `
            <div class="connections">
                <i class="icon-database"></i>
                <span></span>
            </div>
            <div class="info clickable">
                <span></span>
            </div>
            <div class="schemas clickable">
                <i class="icon-search"></i>
                <span></span>
            </div>
            
            <div class="content clickable">
                <i class="icon-doc-text"></i>
                <span></span>
            </div>
            <div class="lang clickable">
                <span>
                </span>
            </div>
            <div class="msg">
            </div>
            <div class="editor clickable">
                <span></span>
            </div>
            <div class="user clickable">
                <span></span>
            </div>
            <div class="version clickable" title="current version">
                <span></span>
            </div>
            
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);
            this.initConnections(element);
            this.initInfo(element);
            this.initFeedbackMenu(element);
            this.user = element.find(".user>span");
            this.content = element.find(".content");
            this.editor = element.find(".editor>span").on("click", () => content_1.default.instance.actionRun("editor.action.gotoLine"));
            this.lang = element.find(".lang>span");
            this.msg = element.find(".msg");
            this.version = element.find(".version>span");
            this.subscribeContentActivated();
            this.subscribeEditorPosition();
            this.initFooterContextMenu();
            this.subscribeFooterMessage();
        }
        subscribeFooterMessage() {
            const cancelHandler = () => {
                if (!this.msgMode) {
                    return;
                }
                this.msgMode = false;
                this.msg.html("");
                this.footer.findAll("div:not(.connections):not(.msg):not(.feed)").css("display", "");
                this.adjustWidths();
                pubsub_1.publish(pubsub_1.FOOTER_MESSAGE_DISMISSED);
            };
            pubsub_1.subscribe(pubsub_1.DISMISS_FOOTER_MESSAGE, () => cancelHandler());
            pubsub_1.subscribe(pubsub_1.FOOTER_MESSAGE, msg => {
                this.msg.html(msg);
                this.msgMode = true;
                const columns = this.footer.css("grid-template-columns").split(" ");
                columns[0] = this.connections.getBoundingClientRect().width + "px";
                columns[1] = "0px";
                columns[2] = "0px";
                columns[3] = "0px";
                columns[4] = "0px";
                columns[5] = "0px";
                columns[6] = "auto";
                columns[7] = "0px";
                columns[8] = "0px";
                columns[9] = "0px";
                columns[10] = "27px";
                this.footer
                    .css("grid-template-columns", columns.join(" "))
                    .findAll("div:not(.connections):not(.msg):not(.feed)")
                    .css("display", "none");
            });
            window.on("click keydown contextmenu", () => cancelHandler());
        }
        subscribeContentActivated() {
            pubsub_1.subscribe(pubsub_1.CONTENT_ACTIVATED, name => {
                if (name) {
                    this.content.showElement().find("span").html(name);
                }
                else {
                    this.content.hideElement();
                    this.editor.html("");
                    this.lang.html("");
                }
                this.adjustWidths();
            });
        }
        subscribeEditorPosition() {
            pubsub_1.subscribe(pubsub_1.EDITOR_POSITION, (language, lineNumber, column, selectionLength) => {
                let selection = "";
                if (selectionLength) {
                    selection = `(${selectionLength} selected)`;
                }
                this.editor.html(`Ln ${lineNumber}, Col ${column} ${(selection)}`);
                this.lang.html(language);
                this.adjustWidths();
            });
        }
        initFooterContextMenu() {
            new footer_context_menu_1.default({
                id: "content-footer-menu",
                event: "click",
                target: this.content,
                items: [],
                beforeOpen: menu => {
                    menu.clearItems();
                    for (let content of content_1.default.instance.getAllContent()) {
                        menu.updateMenuItem(content.id, {
                            text: `${content.data.name} @ ${content.data.connection} / ${content.data.schema}`,
                            checked: content.active,
                            action: () => main_panel_1.MainPanel.instance.activateById(content.id)
                        });
                    }
                    return true;
                }
            });
        }
        initConnections(element) {
            this.connections = element.find(".connections");
            this.schemas = element.find(".schemas");
            pubsub_1.subscribe(pubsub_1.API_INITIAL, (response) => {
                if (!response.ok) {
                    this.connections.find("span").html("¯\\_(ツ)_/¯");
                    return;
                }
                this.user.html(response.data.user).attr("title", `signed in into pgcode as user ${response.data.user}`);
                this.version.html(response.data.version);
                this.schemasMenu = new footer_context_menu_1.default({
                    id: "schema-footer-menu",
                    event: "click",
                    target: this.schemas,
                    items: []
                });
                if (response.data.connections.length === 1) {
                    this.selectConnection(response.data.connections[0]);
                    this.connections.css("cursor", "initial");
                    return;
                }
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
                    items: menuItems,
                    menuItemsCallback: items => {
                        for (let item of items) {
                            item.element.find("span:nth-child(2)")
                                .css("border-left", `2px solid ${api_1.getConnectionColor(item.text)}`)
                                .css("padding-left", "5px");
                        }
                        return items;
                    }
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
            this.adjustWidths();
        }
        async fetchSchema(name) {
            const response = await api_1.fetchSchema(name);
            pubsub_1.publish(pubsub_1.SCHEMA_CHANGED, response.data, response.data.name);
            pubsub_1.publish(pubsub_1.SET_APP_STATUS, api_1.AppStatus.READY);
        }
        adjustWidths() {
            if (this.msgMode == true) {
                return;
            }
            const columns = this.footer.css("grid-template-columns").split(" ");
            columns[0] = this.connections.getBoundingClientRect().width + "px";
            columns[1] = this.info.getBoundingClientRect().width + "px";
            columns[2] = this.schemas.getBoundingClientRect().width + "px";
            columns[3] = this.content.getBoundingClientRect().width + "px";
            columns[4] = this.lang.getBoundingClientRect().width + "px";
            columns[5] = "auto";
            columns[6] = this.msg.getBoundingClientRect().width + "px";
            columns[7] = this.editor.getBoundingClientRect().width + "px";
            columns[8] = this.user.getBoundingClientRect().width + "px";
            columns[9] = this.version.getBoundingClientRect().width + "px";
            columns[10] = "27px";
            this.footer.css("grid-template-columns", columns.join(" "));
        }
        formatTitleFromConn(connection) {
            return `PostgreSQL ${connection.version}\nHost: ${connection.host}\nPort: ${connection.port}\nDatabase: ${connection.database}\nUser: ${connection.user}`;
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=footer.js.map