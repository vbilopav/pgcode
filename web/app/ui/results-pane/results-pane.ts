import { ItemInfoType, getConnectionColor, IStats, INotice, IHeader } from "app/api";
import Results from "app/ui/results-pane/results";
import Messages from "app/ui/results-pane/messages";

enum Status {Ready, Disconnected, Running, Complete}

export default class  {
    //private readonly id: string;
    //private readonly data: ItemInfoType;
    private readonly element: Element;
    private readonly tabs: HTMLCollection;
    private readonly panes: HTMLCollection;
    private readonly footerMsg: Element;
    private readonly footerTime: Element;
    private readonly footerRows: Element;
    private readonly undock: ()=>void;
    private readonly results: Results;
    private status: Status;
    private error: INotice;
    private statsValue: IStats;

    constructor(id: string, element: Element, data: ItemInfoType, undock: ()=>void) {
        //this.id = id;
        //this.data = data;
        this.undock = undock;
        this.element = element.html(String.html`
            <div>
                <div class="tab" id="results" title="results">
                    <i class="icon-database"></i>
                    <span class="title">Results</span>
                    <div class="stripe" style="background-color: ${getConnectionColor(data.connection)}"></div>
                </div>
                <div class="tab" id="messages" title="messages">
                    <i class="icon-database"></i>
                    <span class="title">Messages</span>
                    <div class="stripe" style="background-color: ${getConnectionColor(data.connection)}"></div>
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

        this.results = new Results(id, this.panes[0]);
        new Messages(this.panes[1]);

        this.activateByTab(this.tabs[0]);
        this.status = Status.Disconnected;
    }

    setReady() {
        this.footerMsg.html("🔗 Connected.");
        this.footerTime.html("🕛 --:--:--").css("title", "");
        this.footerRows.html("0 rows").css("title", "");;
        this.status = Status.Ready;
    }

    setDisconnected() {
        this.footerMsg.html("⛔ Disconnected.");
        this.footerTime.html("🕛 --:--:--").attr("title", "");
        this.footerRows.html("0 rows").attr("title", "");;
        this.status = Status.Disconnected;
    }

    setReconnected() {
        // add message Reconnected
    }

    start() {
        this.undock();
        if (this.status == Status.Disconnected) {
            return;
        }
        this.status = Status.Running;
        this.footerMsg.html("Running...");
        this.error = null;
        this.statsValue = null;
        this.results.initGrid();
    }

    stats(e: IStats) {
        console.log(e);
        this.statsValue = e;
        // add message e
    }

    message(e: INotice) {
        console.log(e.messageText);
        if (e.severity == "ERROR") {
            this.error = e;
        }
        // add message e
    }

    header(e: IHeader[]) {
        this.results.addHeader(e);
    }

    row(rn: number, e: Array<string>) {
        this.results.addRow(rn,  e);
    }

    end () {
        if (this.error) {
            this.footerMsg.html(`⚠️ ${this.error.messageText}`);
        } else {
            this.footerMsg.html("✔️ Query executed successfully.");
        }
        
        if (this.statsValue) {
            this.footerTime.html(`🕛 ${this.statsValue.total}`).attr("title", `execution time: ${this.statsValue.execution}\nreading time: ${this.statsValue.read}\ntotal time: ${this.statsValue.total}`);
            this.footerRows.html(`${this.statsValue.rowsAffected} rows`);
        } else if (this.error) {
            this.footerTime.html(`🕛 ${this.error.time}`).attr("title", `execution time: ${this.error.time}`);
            this.footerRows.html(` - `);
        }
        this.adjustGrid();
    }

    adjustGrid() {
        this.results.adjustGrid();
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
