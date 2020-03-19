define(["require", "exports", "app/_sys/storage", "app/_sys/pubsub", "app/ui/main-panel/tabs", "app/ui/main-panel/content"], function (require, exports, storage_1, pubsub_1, tabs_1, content_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _sticky = "sticky";
    const _active = "active";
    const _storage = new storage_1.default({
        stickyId: null,
        activeId: null,
        items: []
    }, "tabs", (name, value) => name === "items" ? JSON.parse(value) : value, (name, value) => name === "items" ? JSON.stringify(value) : value);
    const _updateStorageTabItems = items => setTimeout(() => _storage.items = Array.from(items.entries(), (v, k) => {
        return [v[0], { id: v[1].id, key: v[1].key, timestamp: v[1].timestamp, data: v[1].data }];
    }), 0);
    class default_1 {
        constructor(element) {
            this.headerRows = 1;
            this.items = new Map();
            this.element = element.addClass("main-panel").html(String.html `
                <div></div>
                <div></div>
            `);
            this.tabs = element.children[0];
            this.content = new content_1.default(element.children[1]);
            this.initHeaderAdjustment();
            this.restoreItems();
            pubsub_1.subscribe(pubsub_1.SCHEMA_CHANGED, (data, name) => this.schemaChanged(name, data.connection));
        }
        unstickById(id) {
            if (this.stickyTab && this.stickyTab.id == id) {
                this.stickyTab.removeClass(_sticky);
                this.stickyTab = null;
                _storage.stickyId = null;
            }
        }
        activate(id, key, data) {
            const item = this.items.get(id);
            if (item) {
                this.activateByTab(item.tab);
            }
            else {
                const tab = this.createNew(id, key, data);
                if (this.stickyTab) {
                    this.items.delete(this.stickyTab.id);
                    _storage.stickyId = null;
                    this.stickyTab.replaceWith(this.makeStickyTab(tab));
                }
                else {
                    this.makeStickyTab(tab).appendElementTo(this.tabs);
                }
                this.items.set(id, { tab, id, key, data });
                this.activateByTab(tab, item);
            }
            _updateStorageTabItems(this.items);
        }
        restoreItems() {
            const stickyId = _storage.stickyId;
            const activeId = _storage.activeId;
            for (let [id, storageItem] of _storage.items) {
                const tab = this.createNew(id, storageItem.key, storageItem.data).appendElementTo(this.tabs);
                if (id === stickyId) {
                    this.stickyTab = tab.addClass(_sticky);
                }
                if (id === activeId) {
                    this.activeTab = tab.addClass(_active);
                }
                this.items.set(id, { tab, ...storageItem });
            }
            if (this.activeTab) {
                this.activated(this.activeTab.id);
                this.initiateHeaderAdjust();
            }
        }
        schemaChanged(schema, connection) {
            if (!this.activeTab) {
                return;
            }
            const item = this.items.get(this.activeTab.id);
            if (!item) {
                return;
            }
            if (item.data.schema !== schema || item.data.connection !== connection) {
                return;
            }
            setTimeout(() => pubsub_1.publish(pubsub_1.TAB_SELECTED, item.id, item.key, item.data.schema, item.data.connection), 0);
        }
        activateByTab(tab, item) {
            for (let t of this.tabs.children) {
                if (t.hasClass(_active)) {
                    t.removeClass(_active);
                    let remove = this.items.get(t.id);
                    _storage.activeId = null;
                    pubsub_1.publish(pubsub_1.TAB_UNSELECTED, remove.id, remove.key);
                }
            }
            this.activeTab = tab.addClass(_active);
            _storage.activeId = tab.id;
            this.activated(tab.id, item);
            this.initiateHeaderAdjust();
        }
        activated(id, item) {
            if (!item) {
                item = this.items.get(id);
            }
            item.timestamp = new Date().getTime();
            this.content.activate(id);
            pubsub_1.publish(pubsub_1.TAB_SELECTED, item.id, item.key, item.data.schema, item.data.connection);
        }
        removeByTab(tab) {
            const id = tab.id, active = tab.hasClass(_active), sticky = tab.hasClass(_sticky), item = this.items.get(id);
            this.items.delete(id);
            _storage.activeId = null;
            tab.remove();
            if (sticky) {
                this.stickyTab = null;
                _storage.stickyId = null;
            }
            if (!active) {
                return;
            }
            pubsub_1.publish(pubsub_1.TAB_UNSELECTED, item.id, item.key);
            if (!this.items.size) {
                return;
            }
            let newItem = this.items.maxBy(v => v.timestamp);
            this.activateByTab(newItem.tab, newItem);
            _updateStorageTabItems(this.items);
        }
        createNew(id, key, data) {
            this.content.createNew(id, key, data);
            return tabs_1.default(id, key, data)
                .on("click", e => this.tabClick(e))
                .on("dblclick", e => this.tabDblClick(e));
        }
        makeStickyTab(tab) {
            this.stickyTab = tab;
            _storage.stickyId = tab.id;
            return tab.addClass(_sticky);
        }
        tabClick(e) {
            const target = e.target;
            const currentTarget = e.currentTarget;
            if (target.hasClass("close")) {
                this.removeByTab(currentTarget);
                return;
            }
            this.activateByTab(currentTarget);
            _updateStorageTabItems(this.items);
        }
        tabDblClick(e) {
            const tab = e.currentTarget;
            if (tab.hasClass(_sticky)) {
                tab.removeClass(_sticky);
                this.stickyTab = null;
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
            if (this.activeTab) {
                if (this.activeTab.dataAttr("row") != rows) {
                    this.activeTab.addClass("upper-row");
                }
                else {
                    this.activeTab.removeClass("upper-row");
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