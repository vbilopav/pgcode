import { ItemInfoType, getConnectionColor, INotice, IExecuteResponse } from "app/api";
import Grid from "app/ui/results-pane/grid";
import Messages from "app/ui/results-pane/messages";
import Selection = monaco.Selection;

export default class  {
    //private readonly id: string;
    //private readonly data: ItemInfoType;
    private readonly element: Element;
    private readonly tabs: HTMLCollection;
    private readonly panes: HTMLCollection;
    private readonly footerMsg: Element;
    private readonly footerTime: Element;
    private readonly footerRows: Element;
    private readonly resultsBadge: Element;
    private readonly messagesBadge: Element;
    private readonly undock: ()=>void;
    private readonly grid: Grid;
    private readonly messages: Messages;

    private query: string;
    private selection: Selection

    constructor(id: string, element: Element, data: ItemInfoType, undock: ()=>void) {
        //this.id = id;
        //this.data = data;
        this.undock = undock;
        this.element = element.html(String.html`
            <div>
                <div class="tab" id="results" title="results">
                    <i class="icon-database"></i>
                    <span class="title">
                        Results
                        <span class="badge" style="visibility: hidden;"></span>
                    </span>
                    
                    <div class="stripe" style="background-color: ${getConnectionColor(data.connection)}"></div>
                </div>
                <div class="tab" id="messages" title="messages">
                    <i class="icon-database"></i>
                    <span class="title">
                        Messages
                        <span class="badge" style="visibility: hidden;"></span>
                    </span>
                    <div class="stripe" style="background-color: ${getConnectionColor(data.connection)}"></div>
                </div>
                <div class="side-info">
                    <code></code>
                </div>
            </div>
            <div>
                <div id="results" class="pane"></div>
                <div id="messages" class="pane"></div>
            </div>
            <div>
                <div>
                    <div></div>
                </div>
                <div>
                    <div></div>
                </div>
                <div>
                    <div>-</div>
                </div>
            </div>
        `);

        this.tabs = this.element.children[0].children.on("click", e => this.activateByTab(e.currentTarget as Element));
        this.panes = this.element.children[1].children;

        this.footerMsg = this.element.children[2].children[0].children[0];
        this.footerTime = this.element.children[2].children[1].children[0];
        this.footerRows = this.element.children[2].children[2].children[0];

        this.resultsBadge = this.tabs[0].children[1].children[0];
        this.messagesBadge = this.tabs[1].children[1].children[0];

        this.grid = new Grid(id, this.panes[0]);
        this.messages = new Messages(this.panes[1]);

        this.activateByTab(this.tabs[0]);
    }

    setReady() {
        this.footerMsg.html("🔗 Connected.");
        this.footerTime.html("🕛 --:--:--").css("title", "");
        this.footerRows.html("-").css("title", "");
        this.clearBadges();
    }

    setDisconnected() {
        this.footerMsg.html("⛔ Disconnected.");
        this.footerTime.html("🕛 --:--:--").attr("title", "");
        this.footerRows.html("-").attr("title", "");
        this.clearBadges();
        this.tabs[2].children[0].html("");
    }

    start(query: string, selection: Selection) {
        this.undock();
        
        this.footerMsg.html("Running...");
        this.footerTime.html("🕛 --:--:--").attr("title", "");
        this.footerRows.html(" - ");

        this.grid.init();
        this.messages.clear();
        this.clearBadges();
        this.query = query;
        this.tabs[2].children[0].html(query);
        this.selection = selection;
    }

    notice(e: INotice) {
        console.log("notice", e);
        this.messages.message(e);
    }

    error(e: INotice) {
        console.log("error", e);
        this.footerMsg.html(`⚠️ ${e.messageText}`);
        this.messages.message(e);
    }

    end(e: IExecuteResponse) {
        console.log("end", e);
        this.messages.finished(e);
        if (e.message != "error") {
            this.footerMsg.html("✔️ Query executed successfully.");
        }
        this.footerTime.html(`🕛 ${e.executionTime}`).attr("title", `total time: ${e.executionTime}`);
        this.footerRows.html(`${e.rowsAffected} rows`);
        if (e.rowsAffected < 1) {
            this.activateByTab(this.tabs[1]);
        }  else {
            this.activateByTab(this.tabs[0]);
        }
        this.grid.done(e);
        this.resultsBadge.html(e.rowsAffected.toString()).visible(true);
    }

    adjustGrid() {
        this.grid.adjust();
    }

    private clearBadges() {
        this.resultsBadge.html("").visible(false);
        this.messagesBadge.html("").visible(false);
    }

    private activateByTab(tab: Element) {
        for(let current of this.tabs) {
            current.toggleClass("active", tab.id == current.id);
        }
        for(let pane of this.panes) {
            pane.showElement(tab.id == pane.id);
        }
    }
}
