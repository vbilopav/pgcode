define(["require", "exports", "app/api", "app/ui/results-pane/grid", "app/ui/results-pane/messages"], function (require, exports, api_1, grid_1, messages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            this.messages = new messages_1.default(this.panes[1]);
            this.activateByTab(this.tabs[0]);
        }
        setReady() {
            this.footerMsg.html("🔗 Connected.");
            this.footerTime.html("🕛 --:--:--").css("title", "");
            this.footerRows.html("0 rows").css("title", "");
            ;
        }
        setDisconnected() {
            this.footerMsg.html("⛔ Disconnected.");
            this.footerTime.html("🕛 --:--:--").attr("title", "");
            this.footerRows.html("0 rows").attr("title", "");
            ;
        }
        start() {
            this.undock();
            this.footerMsg.html("Running...");
            this.footerTime.html("🕛 --:--:--").attr("title", "");
            this.footerRows.html(" - ");
            this.grid.init();
            this.messages.clear();
        }
        notice(e) {
            console.log("notice", e);
            this.messages.message(e);
        }
        error(e) {
            console.log("error", e);
            this.footerMsg.html(`⚠️ ${e.messageText}`);
            this.messages.message(e);
        }
        end(e) {
            console.log("end", e);
            this.messages.finished(e);
            if (e.message != "error") {
                this.footerMsg.html("✔️ Query executed successfully.");
            }
            this.footerTime.html(`🕛 ${e.executionTime}`).attr("title", `total time: ${e.executionTime}`);
            this.footerRows.html(`${e.rowsAffected} rows`);
            this.grid.done(e);
        }
        adjustGrid() {
            this.grid.adjust();
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