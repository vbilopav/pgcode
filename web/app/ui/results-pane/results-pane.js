define(["require", "exports", "app/api", "app/ui/results-pane/results", "app/ui/results-pane/messages"], function (require, exports, api_1, results_1, messages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Status;
    (function (Status) {
        Status[Status["Ready"] = 0] = "Ready";
        Status[Status["Disconnected"] = 1] = "Disconnected";
        Status[Status["Running"] = 2] = "Running";
        Status[Status["Complete"] = 3] = "Complete";
    })(Status || (Status = {}));
    class default_1 {
        constructor(id, element, data, undock) {
            this.undock = undock;
            this.element = element.html(String.html `
            <div>
                <div class="tab" id="results" title="results">
                    <i class="icon-database"></i>
                    <span class="title">Results</span>
                    <div class="stripe" style="background-color: ${api_1.getConnectionColor(data.connection)}"></div>
                </div>
                <div class="tab" id="messages" title="messages">
                    <i class="icon-database"></i>
                    <span class="title">Messages</span>
                    <div class="stripe" style="background-color: ${api_1.getConnectionColor(data.connection)}"></div>
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
            this.tabs = this.element.children[0].children.on("click", e => this.activateByTab(e.currentTarget));
            this.panes = this.element.children[1].children;
            this.footerMsg = this.element.children[2].children[0].children[0];
            this.footerTime = this.element.children[2].children[1].children[0];
            this.footerRows = this.element.children[2].children[2].children[0];
            this.results = new results_1.default(id, this.panes[0]);
            new messages_1.default(this.panes[1]);
            this.activateByTab(this.tabs[0]);
            this.status = Status.Disconnected;
        }
        setReady() {
            this.footerMsg.html("🔗 Connected.");
            this.footerTime.html("🕛 --:--:--").css("title", "");
            this.footerRows.html("0 rows").css("title", "");
            ;
            this.status = Status.Ready;
        }
        setDisconnected() {
            this.footerMsg.html("⛔ Disconnected.");
            this.footerTime.html("🕛 --:--:--").attr("title", "");
            this.footerRows.html("0 rows").attr("title", "");
            ;
            this.status = Status.Disconnected;
        }
        setReconnected() {
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
        stats(e) {
            console.log(e);
            this.statsValue = e;
        }
        message(e) {
            console.log(e.messageText);
            if (e.severity == "ERROR") {
                this.error = e;
            }
        }
        header(e) {
            this.results.addHeader(e);
        }
        row(rn, e) {
            this.results.addRow(rn, e);
        }
        end() {
            if (this.error) {
                this.footerMsg.html(`⚠️ ${this.error.messageText}`);
            }
            else {
                this.footerMsg.html("✔️ Query executed successfully.");
            }
            if (this.statsValue) {
                this.footerTime.html(`🕛 ${this.statsValue.total}`).attr("title", `execution time: ${this.statsValue.execution}\nreading time: ${this.statsValue.read}\ntotal time: ${this.statsValue.total}`);
                this.footerRows.html(`${this.statsValue.rowsAffected} rows`);
            }
            else if (this.error) {
                this.footerTime.html(`🕛 ${this.error.time}`).attr("title", `execution time: ${this.error.time}`);
                this.footerRows.html(` - `);
            }
            this.adjustGrid();
        }
        adjustGrid() {
            this.results.adjustGrid();
        }
        activateByTab(tab) {
            for (let current of this.tabs) {
                current.toggleClass("active", tab.id == current.id);
            }
            for (let pane of this.panes) {
                pane.showElement(tab.id == pane.id);
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=results-pane.js.map