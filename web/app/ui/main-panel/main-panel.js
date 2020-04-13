define(["require", "exports", "app/_sys/storage", "app/_sys/pubsub", "app/ui/main-panel/tabs", "app/ui/main-panel/content", "app/api"], function (require, exports, storage_1, pubsub_1, tabs_1, content_1, api_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _storage = new storage_1.default({
        stickyId: null,
        activeId: null,
        items: []
    }, "tabs", (name, value) => name === "items" ? JSON.parse(value) : value, (name, value) => name === "items" ? JSON.stringify(value) : value);
    const _updateStorageTabItems = items => setTimeout(() => _storage.items = Array.from(items.entries(), (v, k) => {
        return [v[0], { id: v[1].id, key: v[1].key, timestamp: v[1].timestamp, data: v[1].data }];
    }), 0);
    let _restored = false;
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
            pubsub_1.subscribe(pubsub_1.SCHEMA_CHANGED, (data, name) => {
                if (!_restored) {
                    this.restoreItems();
                    _restored = true;
                }
                this.schemaChanged(name, data.connection);
            });
        }
        unstickById(id) {
            if (this.stickyTab && this.stickyTab.id == id) {
                this.stickyTab.removeClass(api_1.classes.sticky);
                this.stickyTab = null;
                _storage.stickyId = null;
            }
        }
        activate(id, key, data, contentArgs = api_1.ItemContentArgs) {
            const item = this.items.get(id);
            if (item) {
                this.activateByTab(item.tab);
            }
            else {
                const tab = this.createNew(id, key, data, contentArgs.content);
                if (contentArgs.sticky) {
                    if (this.stickyTab) {
                        this.items.delete(this.stickyTab.id);
                        _storage.stickyId = null;
                        this.stickyTab.replaceWith(this.makeStickyTab(tab));
                    }
                    else {
                        this.makeStickyTab(tab).appendElementTo(this.tabs);
                    }
                }
                else {
                    tab.appendElementTo(this.tabs);
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
                    this.stickyTab = tab.addClass(api_1.classes.sticky);
                }
                if (id === activeId) {
                    this.activeTab = tab.addClass(api_1.classes.active);
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
                if (t.hasClass(api_1.classes.active)) {
                    t.removeClass(api_1.classes.active);
                    let remove = this.items.get(t.id);
                    _storage.activeId = null;
                    pubsub_1.publish(pubsub_1.TAB_UNSELECTED, remove.id, remove.key);
                }
            }
            this.activeTab = tab.addClass(api_1.classes.active);
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
            const id = tab.id, active = tab.hasClass(api_1.classes.active), sticky = tab.hasClass(api_1.classes.sticky), item = this.items.get(id);
            this.items.delete(id);
            tab.remove();
            this.content.remove(id);
            if (sticky) {
                this.stickyTab = null;
                _storage.stickyId = null;
            }
            if (!active) {
                return;
            }
            _storage.activeId = null;
            pubsub_1.publish(pubsub_1.TAB_UNSELECTED, item.id, item.key);
            if (!this.items.size) {
                return;
            }
            let newItem = this.items.maxBy(v => v.timestamp);
            this.activateByTab(newItem.tab, newItem);
        }
        createNew(id, key, data, content = null) {
            this.content.createNew(id, key, data, content);
            return tabs_1.default(id, key, data)
                .on("click", e => this.tabClick(e))
                .on("dblclick", e => this.tabDblClick(e));
        }
        makeStickyTab(tab) {
            this.stickyTab = tab;
            _storage.stickyId = tab.id;
            return tab.addClass(api_1.classes.sticky);
        }
        tabClick(e) {
            const target = e.target;
            const currentTarget = e.currentTarget;
            if (target.hasClass("close")) {
                this.removeByTab(currentTarget);
                _updateStorageTabItems(this.items);
                return;
            }
            this.activateByTab(currentTarget);
            _updateStorageTabItems(this.items);
        }
        tabDblClick(e) {
            const tab = e.currentTarget;
            if (tab.hasClass(api_1.classes.sticky)) {
                tab.removeClass(api_1.classes.sticky);
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