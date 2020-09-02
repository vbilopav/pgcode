define(["require", "exports", "app/api", "app/ui/results-pane/grid", "app/ui/results-pane/messages"], function (require, exports, api_1, grid_1, messages_1) {
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
            this.grid = new grid_1.default(id, this.panes[0]);
            new messages_1.default(this.panes[1]);
            this.activateByTab(this.tabs[0]);
            this.status = Status.Disconnected;
        }
        setConnectionId(connectionId) {
            this.grid.setConnectionId(connectionId);
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
            this.grid.init();
        }
        message(e) {
            console.log(e.messageText);
            if (e.severity == "ERROR") {
                this.error = e;
                this.end(null);
            }
        }
        header(e) {
            this.grid.addHeader(e);
        }
        row(rn, e) {
            this.grid.addRow(rn, e);
        }
        end(stats) {
            console.log(stats);
            this.grid.done(stats);
            if (this.error) {
                this.footerMsg.html(`⚠️ ${this.error.messageText}`);
            }
            else {
                this.footerMsg.html("✔️ Query executed successfully.");
            }
            if (stats) {
                this.footerTime.html(`🕛 ${stats.total}`).attr("title", `execution time: ${stats.execution}\nreading time: ${stats.read}\ntotal time: ${stats.total}`);
                this.footerRows.html(`${stats.rowsAffected} rows`);
            }
            else if (this.error) {
                if (this.error.time) {
                    this.footerTime.html(`🕛 ${this.error.time}`).attr("title", `execution time: ${this.error.time}`);
                }
                this.footerRows.html(` - `);
            }
        }
        adjustGrid() {
            this.grid.adjust();
        }
        estimateNumberOfItems() {
            return this.grid.estimateNumberOfItems();
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