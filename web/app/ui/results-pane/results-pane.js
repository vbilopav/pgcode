define(["require", "exports", "app/api"], function (require, exports, api_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(id, element, data) {
            this.id = id;
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
                <div id="results">results</div>
                <div id="messages">messages</div>
            </div>
        `);
            this.tabs = this.element.children[0].children.on("click", e => this.activateByTab(e.currentTarget));
            this.panes = this.element.children[1].children;
            this.activateByTab(this.tabs[0]);
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