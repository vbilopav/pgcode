import { ContextMenuCtorArgs, MenuItemType, ContextMenuItem } from "app/controls/context-menu";
import FooterContextMenu from "app/controls/footer-context-menu";
import MonacoContextMenu from "app/controls/monaco-context-menu";
import Storage from "app/_sys/storage";
import { 
    fetchConnection, fetchSchema, IConnectionInfo, AppStatus, IResponse, IInitialResponse, getConnectionColor 
} from "app/api";
import { 
    publish, subscribe, 
    SET_APP_STATUS, API_INITIAL, SCHEMA_CHANGED, CONTENT_ACTIVATED, EDITOR_POSITION
} from "app/_sys/pubsub";
import Content from "app/ui/content/content";
import { MainPanel } from "app/ui/main-panel/main-panel";

interface IStorage {connection: string}

const 
    storage = new Storage({connection: null}) as any as IStorage;

export default class  {
    private footer: Element;
    private connections: Element;
    private schemas: Element;
    private info: Element;
    private user: Element;
    private content: Element;
    private editor: Element;
    private lang: Element;
    private version: Element;
    private selectedConnection?: IConnectionInfo = null;
    private connectionMenu: FooterContextMenu = null;
    private schemasMenu: FooterContextMenu = null;

    constructor(element: Element) {
        this.footer = element.addClass("footer").html(String.html`
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
            
            <div class="content clickable">
                <i class="icon-doc-text"></i>
                <span></span>
            </div>
            <div class="editor clickable">
                <span></span>
            </div>
            <div class="lang clickable">
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
        this.editor = element.find(".editor>span").on("click", () => Content.instance.actionRun("editor.action.gotoLine"));
        this.lang = element.find(".lang>span");
        this.version = element.find(".version>span");

        subscribe(CONTENT_ACTIVATED, name => {
            if (name) {
                this.content.showElement().find("span").html(name)
            } else {
                this.content.hideElement();
                this.editor.html("");
                this.lang.html("");
            }
            this.adjustWidths();
        });

        subscribe(EDITOR_POSITION, (language , lineNumber, column, selectionLength) => {
            let selection = "";
            if (selectionLength) {
                selection = `(${selectionLength} selected)`;
            }
            this.editor.html(`Ln ${lineNumber}, Col ${column} ${(selection)}`);
            this.lang.html(language);
            this.adjustWidths();
        });

        new FooterContextMenu({
            id: "content-footer-menu", 
            event: "click", 
            target: this.content, 
            items: [],
            beforeOpen: menu => {
                menu.clearItems();
                for(let content of Content.instance.getAllContent()) {
                    menu.updateMenuItem(content.id, {
                        text: `${content.data.name} @ ${content.data.connection} / ${content.data.schema}`, 
                        checked: content.active,
                        action: () => MainPanel.instance.activateById(content.id)
                    });
                }
                return true;
            }
        } as ContextMenuCtorArgs);
    }

    private initConnections(element: Element) {
        this.connections = element.find(".connections");
        this.schemas  = element.find(".schemas");

        subscribe(API_INITIAL, (response: IResponse<IInitialResponse>) => {
            if (!response.ok) {
                this.connections.find("span").html("¯\\_(ツ)_/¯");
                return;
            } 
            this.user.html(response.data.user).attr("title", `signed in into pgcode as user ${response.data.user}`);
            this.version.html(response.data.version);

            this.schemasMenu = new FooterContextMenu({
                id: "schema-footer-menu", 
                event: "click", 
                target: this.schemas, 
                items: []
            } as ContextMenuCtorArgs);
            
            if (response.data.connections.length === 1) {
                this.selectConnection(response.data.connections[0]);
                this.connections.css("cursor", "initial");
                return;
            } 

            const menuItems = new Array<MenuItemType>();
            for(let connection of response.data.connections) {
                menuItems.push({
                    id: connection.name, 
                    text: connection.name, 
                    data: this.formatTitleFromConn(connection), 
                    action: () => this.selectConnection(connection)
                }); 
            }
            this.connectionMenu = new FooterContextMenu({
                id: "conn-footer-menu", 
                event: "click", 
                target: this.connections, 
                items: menuItems,
                menuItemsCallback: items => {
                    for(let item of items as ContextMenuItem[]) {
                        item.element.find("span:nth-child(2)")
                        .css("border-left", `2px solid ${getConnectionColor(item.text)}`)
                        .css("padding-left", "5px");
                    }
                    return items;
                }
            } as ContextMenuCtorArgs);

            //this.info.on("click", () => this.connections.trigger("click"));
            
            if (!storage.connection) {
                this.selectConnection();
            } else {
                const name = storage.connection;
                const selected = response.data.connections.filter(c => c.name === name);
                if (!selected.length) {
                    storage.connection = name;
                    this.selectConnection();
                } else {
                    this.selectConnection(selected[0]);
                }
            }
        });
    }

    private initInfo(element: Element) {
        this.info = element.find(".info");
        const hidden = (String.html`<input id="footer-copy" type="text" class="out-of-viewport" />` as String).
            toElement().
            appendElementTo(document.body) as HTMLInputElement;
        new MonacoContextMenu({
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
        } as ContextMenuCtorArgs);
    }

    private initFeedbackMenu(element: Element) {
        const btn = element.find(".feed");
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

    private async selectConnection(connection?: IConnectionInfo) {
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
            publish(SET_APP_STATUS, AppStatus.NO_CONNECTION);
        } else {
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
                    this.connectionMenu.updateMenuItem(checked.id, {checked: false} as MenuItemType);
                }
                this.connectionMenu.updateMenuItem(name, {checked: true} as MenuItemType);
            }
            storage.connection = name;

            const response = await fetchConnection(name);
            if (response.ok) {
                const menuItems = new Array<MenuItemType>();
                for(let schema of response.data.schemas.names) {
                    menuItems.push({
                        id: schema, 
                        text: schema, 
                        checked: response.data.schemas.selected === schema,
                        action: () => {
                            this.selectSchema(schema);
                            this.fetchSchema(schema)
                        }
                    }); 
                }
                this.schemasMenu.setMenuItems(menuItems);
                this.schemas.showElement().find("span").html(response.data.schemas.selected);
                this.selectSchema(response.data.schemas.selected);
                publish(SCHEMA_CHANGED, response.data, response.data.schemas.selected);
                publish(SET_APP_STATUS, AppStatus.READY, name);
            }
        }
        this.adjustWidths();
    }

    private selectSchema(name: string) {
        const checked = this.schemasMenu.getCheckedItem();
        if (checked) {
            this.schemasMenu.updateMenuItem(checked.id, {checked: false} as MenuItemType)
        } else {
            if (checked.id === name) {
                return;
            }
        }
        this.schemasMenu.updateMenuItem(name, {checked: true} as MenuItemType);
        this.schemas.showElement().find("span").html(name);
        this.adjustWidths();
    }

    private async fetchSchema(name: string) {
        const response = await fetchSchema(name);
        publish(SCHEMA_CHANGED, response.data, response.data.name);
        publish(SET_APP_STATUS, AppStatus.READY);
    }

    private adjustWidths() {
        const columns = this.footer.css("grid-template-columns").split(" ");
        columns[0] = this.connections.getBoundingClientRect().width + "px";
        columns[1] = this.info.getBoundingClientRect().width + "px";
        columns[2] = this.schemas.getBoundingClientRect().width + "px";
        columns[3] = this.content.getBoundingClientRect().width + "px"
        columns[4] = this.lang.getBoundingClientRect().width + "px";
        columns[5] = "auto";
        columns[6] = "auto"; // msg
        columns[7] = this.editor.getBoundingClientRect().width + "px";
        columns[8] = this.user.getBoundingClientRect().width + "px"
        columns[9] = this.version.getBoundingClientRect().width + "px";
        columns[10] = "27px"; // feed

        this.footer.css("grid-template-columns", columns.join(" "));
    }

    private formatTitleFromConn(connection: IConnectionInfo) {
        return `PostgreSQL ${connection.version}\nHost: ${connection.host}\nPort: ${connection.port}\nDatabase: ${connection.database}\nUser: ${connection.user}`;
    }
}