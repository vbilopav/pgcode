import { ContextMenuCtorArgs, MenuItemType } from "app/controls/context-menu";
import FooterContextMenu from "app/controls/footer-context-menu";
import Storage from "app/_sys/storage";
import { AppStatus, IConnectionInfo, IResponse, IInitial } from "app/types";
import { publish, subscribe, SET_APP_STATUS, API_INITIAL } from "app/_sys/pubsub";

interface IStorage {connection: string}

const 
    storage = new Storage({connection: null}) as any as IStorage;

export default class  {
    private footer: Element;
    private connections: Element;
    private connectionsText: Element;
    private info: Element;
    private selectedConnection?: IConnectionInfo = null;
    private connectionMenu: FooterContextMenu;

    constructor(element: Element) {
        this.footer = element.addClass("footer").html(String.html`
            <div class="connections">
                <span class="icon-database"></span>
                <span class="connections-text"></span>
            </div>
            <div class="info"></div>
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);
        this.connections = element.find(".connections");
        this.connectionsText = this.connections.find(".connections-text");
        this.info = element.find(".info");

        this.initFeedbackMenu(element.find(".feed"));
        subscribe(API_INITIAL, response => this.initConnectionsMenu(response));
    }

    private initConnectionsMenu(response: IResponse<IInitial>) {
        if (!response.ok) {
            this.connectionsText.html("¯\\_(ツ)_/¯");
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
    }

    private selectConnection(connection?: IConnectionInfo) {
        if (this.selectedConnection === connection) {
            return;
        }
        this.selectedConnection = connection;
        const name = (connection ? connection.name : null);
        if (!connection) {
            this.connectionsText.html("Connection not selected");
            this.connectionsText.attr("title", "Click here to select from available connections...");
            this.info.html("");
            this.info.attr("title", "no connection...");
            storage.connection = null;
            publish(SET_APP_STATUS, AppStatus.NO_CONNECTION);
        } else {
            this.connectionsText.html(name);
            const title = this.formatTitleFromConn(connection);
            this.connectionsText.attr("title", title);
            this.info.html(`<img src="favicon.ico" />v${connection.version}&nbsp;&nbsp;//${connection.user}@${connection.host}:${connection.port}/${connection.database}`);
            this.info.attr("title", title);
            if (this.connectionMenu) {
                let old = storage.connection;
                if (old) {
                    this.connectionMenu.updateMenuItem(old, {checked: false});
                }
                this.connectionMenu.updateMenuItem(name, {checked: true});
            }
            storage.connection = name;
            //
            // fetch metadata from public
            //
            publish(SET_APP_STATUS, AppStatus.READY, name);
        }
        const rect = this.connections.getBoundingClientRect();
        let columns = this.footer.css("grid-template-columns").split(" ")
        columns[0] = rect.width + "px";
        columns[2] = "auto";
        this.footer.css("grid-template-columns", columns.join(" "));
    }

    private formatTitleFromConn(connection: IConnectionInfo) {
        return `PostgreSQL ${connection.version}\nHost: ${connection.host}\nPort: ${connection.port}\nDatabase: ${connection.database}\nUser: ${connection.user}`;
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