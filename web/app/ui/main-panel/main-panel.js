define(["require", "exports", "app/_sys/pubsub", "app/types", "app/api", "vs/editor/editor.main"], function (require, exports, pubsub_1, types_1, api_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _items = {};
    let _activeTab;
    let _sticky;
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
        async activateScript(script) {
            const id = api_1.ScriptId(script.id);
            const item = _items[id];
            if (item) {
                this.activateByTab(item.tab);
            }
            else {
                const tab = this.createTabElement("icon-doc-text", script.title, id);
                if (_sticky) {
                    delete _items[_sticky.id];
                    _sticky.replaceWith(this.sticky(tab));
                }
                else {
                    this.sticky(tab).appendElementTo(this.tabs);
                }
                _items[id] = { tab, id, key: types_1.Keys.SCRIPTS };
                this.activateByTab(tab);
            }
        }
        activateByTab(tab) {
            for (let t of this.tabs.children) {
                t.removeClass("active");
            }
            _activeTab = tab.addClass("active");
            this.activated(tab.id);
            this.initiateHeaderAdjust();
        }
        activated(id) {
            let item = _items[id];
            pubsub_1.publish(pubsub_1.TAB_SELECTED, item.id, item.key);
        }
        removeByTab(tab) {
        }
        createTabElement(iconClass, title, key) {
            return String.html `
        <div class="tab">
            <i class=${iconClass}></i>
            <span class="title">${title}</span>
            <i class="close" title="close">&#10006</i>
        </div>`
                .toElement()
                .attr("id", key)
                .on("click", e => this.tabClick(e))
                .on("dblclick", e => this.tabDblClick(e));
        }
        sticky(tab) {
            _sticky = tab;
            return tab.addClass("sticky");
        }
        tabClick(e) {
            const target = e.target;
            if (target.hasClass("close")) {
                this.removeByTab(target);
                return;
            }
            this.activateByTab(e.currentTarget);
        }
        tabDblClick(e) {
            const tab = e.currentTarget;
            if (tab.hasClass("sticky")) {
                tab.removeClass("sticky");
                _sticky = null;
            }
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
                t.dataAttr("row", rows);
            }
            if (_activeTab) {
                if (_activeTab.dataAttr("row") != rows) {
                    _activeTab.addClass("upper-row");
                }
                else {
                    _activeTab.removeClass("upper-row");
                }
            }
            if (rows != this.headerRows) {
                this.element.css("grid-template-rows", `${rows * this.headerHeight}px auto`);
                this.headerRows = rows;
            }
            this.adjustTimeout = undefined;
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=main-panel.js.map