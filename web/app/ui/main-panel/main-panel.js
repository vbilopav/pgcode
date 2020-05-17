define(["require", "exports", "app/_sys/storage", "app/_sys/pubsub", "app/ui/main-panel/tabs", "app/controls/monaco-context-menu", "app/ui/content/content", "app/api", "app/_sys/timeout"], function (require, exports, storage_1, pubsub_1, tabs_1, monaco_context_menu_1, content_1, api_1, timeout_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _storage = new storage_1.default({
        stickyId: null,
        activeId: null,
        items: []
    }, "tabs", (name, value) => name === "items" ? JSON.parse(value) : value, (name, value) => name === "items" ? JSON.stringify(value) : value);
    const _updateStorageTabItems = items => setTimeout(() => _storage.items = Array.from(items.entries(), (v, k) => {
        return [v[0], { id: v[1].id, key: v[1].key, timestamp: v[1].timestamp, data: v[1].data }];
    }));
    let contextMenu;
    class MainPanel {
        constructor(element) {
            this.headerRows = 1;
            this.items = new Map();
            this.element = element.addClass("main-panel").html(String.html `
                <div></div>
                <div></div>
            `);
            this.tabs = element.children[0];
            contextMenu = new monaco_context_menu_1.default({
                id: "main-panel-tabs-ctx-menu",
                items: [
                    { text: "Close", action: (_, tab) => this.removeByTab(tab) },
                    { splitter: true },
                    { text: "Close Others", action: (_, tab) => this.removeExceptTab(tab) },
                    { text: "Close to the Right", action: (_, tab) => this.removeToTheRightByTab(tab) },
                    { text: "Close to the Left", action: (_, tab) => this.removeToTheLeftByTab(tab) },
                    { splitter: true },
                    { text: "Copy content", action: (_, tab) => this.copyContentByTab(tab) },
                ],
                target: this.tabs,
                beforeOpen: (menu, event) => {
                    for (let p of event.composedPath()) {
                        if (p.hasClass("main-panel")) {
                            return false;
                        }
                        if (p.hasClass("tab")) {
                            menu.args = p;
                            return true;
                        }
                    }
                    return false;
                }
            });
            this.content = new content_1.default(element.children[1]);
            this.initHeaderAdjustment();
            pubsub_1.subscribe(pubsub_1.SCHEMA_CHANGED, (data, name) => this.schemaChanged(name, data.connection));
            pubsub_1.subscribe(pubsub_1.SCRIPT_UPDATED, data => tabs_1.updateScriptTabElement(this.items, data));
            pubsub_1.subscribe(pubsub_1.API_INITIAL, () => this.restoreItems());
            this.hiddenCopy = String.html `<textarea id="main-panel-hidden-copy" type="text" class="out-of-viewport"></textarea>`.toElement().
                appendElementTo(document.body);
            MainPanel.instance = this;
        }
        unstickById(id) {
            if (this.stickyTab && this.stickyTab.id == id) {
                this.stickyTab.removeClass(api_1.classes.sticky);
                this.stickyTab = null;
                _storage.stickyId = null;
                this.content.setStickStatus(id, false);
            }
        }
        activate(id, key, data, contentArgs) {
            const item = this.items.get(id);
            if (item) {
                this.activateByTab(item.tab);
            }
            else {
                this.content.createOrActivateContent(id, key, data, contentArgs);
                const tab = this.createNewTab(id, key, data);
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
        activateById(id) {
            this.activateByTab(this.tabs.find("#" + id));
        }
        restoreItems() {
            const stickyId = _storage.stickyId;
            const activeId = _storage.activeId;
            for (let [id, storageItem] of _storage.items) {
                if (!api_1.connectionIsDefined(storageItem.data.connection)) {
                    continue;
                }
                this.content.createNewContent(id, storageItem.key, storageItem.data);
                const tab = this.createNewTab(id, storageItem.key, storageItem.data).appendElementTo(this.tabs);
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
            setTimeout(() => pubsub_1.publish(pubsub_1.TAB_SELECTED, item.id, item.key, item.data.schema, item.data.connection));
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
        createNewTab(id, key, data) {
            return tabs_1.createTabElement(id, key, data)
                .on("click", e => this.tabClick(e))
                .on("dblclick", e => this.tabDblClick(e))
                .on("dragstart", e => {
                this.activateByTab(e.currentTarget);
                e.dataTransfer.setData("tab-id", e.currentTarget.id);
            })
                .on("dragover", e => e.preventDefault())
                .on("dragenter", e => e.currentTarget.addClass("drop-target"))
                .on("dragleave", e => e.currentTarget.removeClass("drop-target"))
                .on("drop", e => {
                e.preventDefault();
                const target = e.currentTarget.removeClass("drop-target");
                const tab = this.items.get(e.dataTransfer.getData("tab-id")).tab;
                tab.switchPlaces(target);
                _updateStorageTabItems(this.items.switchByKeys(target.id, tab.id));
            });
        }
        makeStickyTab(tab) {
            this.stickyTab = tab;
            _storage.stickyId = tab.id;
            this.content.setStickStatus(tab.id, true);
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
            if (!currentTarget.hasClass(api_1.classes.active)) {
                this.activateByTab(currentTarget);
            }
            _updateStorageTabItems(this.items);
        }
        tabDblClick(e) {
            const tab = e.currentTarget;
            if (tab.hasClass(api_1.classes.sticky)) {
                tab.removeClass(api_1.classes.sticky);
                this.stickyTab = null;
                _storage.stickyId = null;
                this.content.setStickStatus(tab.id, false);
            }
        }
        initHeaderAdjustment() {
            this.headerHeight = Number(this.element.css("grid-template-rows").split(" ")[0].replace("px", ""));
            window.on("resize", () => this.initiateHeaderAdjust());
            pubsub_1.subscribe(pubsub_1.SPLITTER_CHANGED, () => this.initiateHeaderAdjust());
        }
        initiateHeaderAdjust() {
            timeout_1.timeout(() => this.adjustHeaderHeight(), 10, "main-panel-adjust");
        }
        adjustHeaderHeight() {
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
        }
        removeExceptTab(tab) {
            const remove = Array();
            for (let toRemove of tab.parentElement.children) {
                if (toRemove && toRemove.hasClass("tab") && toRemove.id != tab.id) {
                    remove.push(toRemove);
                }
            }
            if (remove.length) {
                remove.forEach(tab => this.removeByTab(tab));
                _updateStorageTabItems(this.items);
            }
        }
        removeToTheRightByTab(tab) {
            this.removeSiblingsByTab(tab, "nextElementSibling");
        }
        removeToTheLeftByTab(tab) {
            this.removeSiblingsByTab(tab, "previousElementSibling");
        }
        removeSiblingsByTab(tab, property) {
            const remove = Array();
            while (true) {
                tab = tab[property];
                if (!tab || !tab.hasClass("tab")) {
                    break;
                }
                remove.push(tab);
            }
            if (remove.length) {
                remove.forEach(tab => this.removeByTab(tab));
                _updateStorageTabItems(this.items);
            }
        }
        copyContentByTab(tab) {
            this.hiddenCopy.html(this.content.getContent(tab.id));
            this.hiddenCopy.select();
            document.execCommand("copy");
            this.hiddenCopy.html("");
        }
    }
    exports.MainPanel = MainPanel;
});
//# sourceMappingURL=main-panel.js.map