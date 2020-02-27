define(["require", "exports", "app/_sys/pubsub", "vs/editor/editor.main"], function (require, exports, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            this.headerRows = 1;
            this.element = element.addClass("main-panel").html(String.html `
                <div></div>
                <div></div>
            `);
            this.tabs = element.children[0];
            this.content = element.children[1];
            this.initHeaderAdjustment();
        }
        async activateScript(id, title) {
            const tab = String.html `
            <div class="tab">
                <i class="icon-doc-text"></i>
                <span>${title}</span>
                <i class="close" title="close">&#10006</i>
            </div>`
                .toElement()
                .on("click", e => this.tabClick(e))
                .appendElementTo(this.tabs);
            this.activateByTab(tab);
            this.adjustHeaderHeight();
        }
        activateByTab(tab) {
            this.tabs.children.forEachChild;
            for (let t of this.tabs.children) {
                t.removeClass("active");
            }
            tab.addClass("active");
        }
        removeByTab(tab) {
        }
        tabClick(e) {
            const target = e.target;
            if (target.hasClass("close")) {
                this.removeByTab(target);
                return;
            }
            this.activateByTab(e.currentTarget);
        }
        initHeaderAdjustment() {
            this.headerHeight = Number(this.element.css("grid-template-rows").split(" ")[0].replace("px", ""));
            window.on("resize", () => this.initiateHeaderAdjust());
            pubsub_1.subscribe(pubsub_1.SPLITTER_CHANGED, () => this.initiateHeaderAdjust());
        }
        initiateHeaderAdjust() {
            if (this.adjustTimeout) {
                clearTimeout(this.adjustTimeout);
            }
            this.adjustTimeout = setTimeout(() => this.adjustHeaderHeight(), 10);
        }
        adjustHeaderHeight() {
            if (this.adjustTimeout) {
                clearTimeout(this.adjustTimeout);
            }
            let lastTop;
            let rows = 1;
            for (let t of this.tabs.children) {
                let top = t.getBoundingClientRect().top;
                if (lastTop != undefined && lastTop < top) {
                    rows++;
                }
                lastTop = top;
            }
            if (rows == this.headerRows) {
                return;
            }
            let split = this.element.css("grid-template-rows").split(" ");
            this.element.css("grid-template-rows", `${rows * this.headerHeight}px ${split[1]}`);
            this.headerRows = rows;
            this.adjustTimeout = undefined;
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=main-panel.js.map