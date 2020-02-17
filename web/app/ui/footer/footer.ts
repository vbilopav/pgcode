import { ContextMenuCtorArgs, MenuItemType } from "app/controls/context-menu";
import FooterContextMenu from "app/controls/footer-context-menu";
import MonacoContextMenu from "app/controls/monaco-context-menu";
import Storage from "app/_sys/storage";
import { AppStatus, IConnectionInfo } from "app/types";
import { fetchWsConnection, fetchWorkspace } from "app/api";
import { publish, subscribe, SET_APP_STATUS, API_INITIAL, WS_CHANGED } from "app/_sys/pubsub";

interface IStorage {connection: string}

const 
    storage = new Storage({connection: null}) as any as IStorage;

export default class  {
    private footer: Element;
    private connections: Element;
    private schemas: Element;
    private info: Element;
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
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);

        this.initConnections(element);
        this.initInfo(element);
        this.initFeedbackMenu(element);
    }

    private initConnections(element: Element) {
        this.connections = element.find(".connections");
        this.schemas  = element.find(".schemas");

        subscribe(API_INITIAL, response => {
            if (!response.ok) {
                this.connections.find("span").html("¯\\_(ツ)_/¯");
            } else {
                if (response.data.connections.length === 1) {
                    
                    this.selectConnection(response.data.connections[0]);
                    this.connections.css("cursor", "initial");
    
                } else {
    
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
                        items: menuItems
                    } as ContextMenuCtorArgs);

                    this.schemasMenu = new FooterContextMenu({
                        id: "schema-footer-menu", 
                        event: "click", 
                        target: this.schemas, 
                        items: []
                    } as ContextMenuCtorArgs);
                    
                    //this.info.on("click", () => this.connections.trigger("click"));
                    
                    if (!storage.connection) {
                        this.selectConnection();
                    } else {
                        const name = storage.connection;
                        const selected = response.data.connections.filter(c => c.name === name);
                        if (!selected.length) {
                            storage.connection = name
                            this.selectConnection();
                        } else {
                            this.selectConnection(selected[0]);
                        }
                    }
    
                }
            }
        });
    }

    private initInfo(element: Element) {
        this.info = element.find(".info");
        const hidden = (String.html`<input id="hidden" type="text" class="out-of-viewport" />` as String).
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
            target: btn as Element,
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
                    this.connectionMenu.updateMenuItem(checked.id, {checked: false});
                }
                this.connectionMenu.updateMenuItem(name, {checked: true});
            }
            storage.connection = name;

            const response = await fetchWsConnection(name);
            if (response.ok) {
                const menuItems = new Array<MenuItemType>();
                for(let schema of response.data.schemas.names) {
                    menuItems.push({
                        id: schema, 
                        text: schema, 
                        checked: response.data.schemas.selected === schema,
                        action: () => {
                            this.selectSchema(schema);
                            this.fetchWorkspace(schema)
                        }
                    }); 
                }
                this.schemasMenu.setMenuItems(menuItems);
                this.schemas.showElement().find("span").html(response.data.schemas.selected);
                this.selectSchema(response.data.schemas.selected);
                publish(WS_CHANGED, response.data);
                publish(SET_APP_STATUS, AppStatus.READY, name);
            }
        }
        this.adjustWidths();
    }

    private selectSchema(name: string) {
        const checked = this.schemasMenu.getCheckedItem();
        if (checked) {
            this.schemasMenu.updateMenuItem(checked.id, {checked: false})
        } else {
            if (checked.id === name) {
                return;
            }
        }
        this.schemasMenu.updateMenuItem(name, {checked: true});
        this.schemas.showElement().find("span").html(name);
    }

    private async fetchWorkspace(name: string) {
        const response = await fetchWorkspace(name);
        publish(WS_CHANGED, response.data);
        publish(SET_APP_STATUS, AppStatus.READY);
    }

    private adjustWidths() {
        const columns = this.footer.css("grid-template-columns").split(" ")
        columns[0] = this.connections.getBoundingClientRect().width + "px";
        columns[1] = this.info.getBoundingClientRect().width + "px";
        columns[2] = this.schemas.getBoundingClientRect().width + "px";
        columns[3] = "auto";
        this.footer.css("grid-template-columns", columns.join(" "));
    }

    private formatTitleFromConn(connection: IConnectionInfo) {
        return `PostgreSQL ${connection.version}\nHost: ${connection.host}\nPort: ${connection.port}\nDatabase: ${connection.database}\nUser: ${connection.user}`;
    }
}