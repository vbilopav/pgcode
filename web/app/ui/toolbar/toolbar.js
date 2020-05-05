define(["require", "exports", "app/_sys/storage", "app/_sys/pubsub", "app/controls/monaco-context-menu", "app/api"], function (require, exports, storage_1, pubsub_1, monaco_context_menu_1, api_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ButtonRoles;
    (function (ButtonRoles) {
        ButtonRoles["switch"] = "switch";
        ButtonRoles["toggle"] = "toggle";
    })(ButtonRoles || (ButtonRoles = {}));
    ;
    const _isInRole = (e, role) => e.dataAttr("role") === role, _isSwitch = e => _isInRole(e, ButtonRoles.switch), _moveText = (position) => position === api_1.Position.LEFT ? "Move Toolbar to Right" : "Move Toolbar to Left";
    const _storage = new storage_1.default({
        scripts: false,
        tables: false,
        views: false,
        routines: false,
        search: false,
        previousKey: api_1.Keys.SCRIPTS,
        pgcode: false
    }, "state", (name, value) => {
        if (name !== "previousKey") {
            return JSON.parse(value);
        }
        return value;
    });
    const _items = [
        { id: `btn-${api_1.Keys.SCRIPTS}`, icon: "icon-doc-text", key: api_1.Keys.SCRIPTS, label: api_1.Keys.SCRIPTS, text: "Scripts", keyBinding: "Ctrl+S", role: ButtonRoles.switch },
        { id: `btn-${api_1.Keys.TABLES}`, icon: "icon-database", key: api_1.Keys.TABLES, label: api_1.Keys.TABLES, text: "Tables", keyBinding: "Ctrl+T", role: ButtonRoles.switch },
        { id: `btn-${api_1.Keys.VIEWS}`, icon: "icon-database", key: api_1.Keys.VIEWS, label: api_1.Keys.VIEWS, text: "Views", keyBinding: "Ctrl+V", role: ButtonRoles.switch },
        { id: `btn-${api_1.Keys.ROUTINES}`, icon: "icon-database", key: api_1.Keys.ROUTINES, label: api_1.Keys.ROUTINES, text: "Routines", keyBinding: "Ctrl+R", role: ButtonRoles.switch },
        { id: `btn-${api_1.Keys.SEARCH}`, icon: "icon-search", key: api_1.Keys.SEARCH, label: api_1.Keys.SEARCH, text: "Search", keyBinding: "Ctrl+F", role: ButtonRoles.switch },
    ];
    class default_1 {
        constructor(element, position, index) {
            let html = "";
            let menuItems = new Array();
            for (let item of _items) {
                html = html + String.html `
            <div class="${item.icon} ${item.id}" id="${item.id}" data-key="${item.key}" data-role="${item.role}" title="${item.label} (${item.keyBinding})">
                <div class="marker"></div>
                <div class="lbl">${item.label}</div>
                <div class="count" style="display: none"></div>
            </div>`;
                if (item.text) {
                    menuItems.push({
                        id: item.key,
                        text: item.text,
                        keyBindingsInfo: item.keyBinding,
                        action: () => element.find("#" + item.id).trigger("click")
                    });
                }
            }
            this.toolbar = element.addClass("toolbar").html(html);
            if (position === api_1.Position.RIGHT) {
                this.toolbar.addClass("right");
            }
            menuItems.push({ splitter: true }, {
                id: "move",
                text: _moveText(position),
                action: () => {
                    let newPosition = position == api_1.Position.LEFT ? api_1.Position.RIGHT : api_1.Position.LEFT;
                    if (index.moveToolbar(newPosition)) {
                        position = newPosition;
                        if (position === api_1.Position.RIGHT) {
                            this.toolbar.addClass("right");
                        }
                        else {
                            this.toolbar.removeClass("right");
                        }
                        this.menu.updateMenuItem("move", { text: _moveText(position) });
                    }
                }
            });
            this.menu = new monaco_context_menu_1.default({ id: "ctx-menu-toolbar", items: menuItems, target: element });
            this.buttons = this.toolbar.children.on("click", (e) => this.buttonClicked(e.currentTarget));
            for (let e of this.buttons) {
                const key = e.dataAttr("key");
                this.setButtonState(e, _storage[key], key);
            }
            pubsub_1.subscribe(pubsub_1.SIDEBAR_DOCKED, () => this.sidebarDocked());
            pubsub_1.subscribe(pubsub_1.SIDEBAR_UNDOCKED, () => this.sidebarUndocked());
            pubsub_1.subscribe(pubsub_1.ITEM_COUNT_CHANGED, (key, count) => {
                let btn = this.buttons.namedItem("btn-" + key);
                let e = btn.find(".count").html(count).showElement();
                if (count.toString().length > 2) {
                    e.css("width", "16px");
                }
                else {
                    e.css("width", "10px");
                }
                let hint = btn.attr("title").split("\n");
                btn.attr("title", hint[0] + "\n" + count + " items");
            });
            pubsub_1.subscribe(pubsub_1.TAB_SELECTED, (_, key, schema, connection) => {
                if (!key) {
                    return;
                }
                if (schema !== api_1.getCurrentSchema() || connection !== api_1.getCurrentConnection()) {
                    return;
                }
                for (let btn of this.buttons) {
                    const active = btn.hasClass(api_1.classes.active);
                    if (key === btn.dataAttr("key")) {
                        if (!active) {
                            btn.addClass(api_1.classes.active);
                        }
                    }
                    else {
                        if (active) {
                            btn.removeClass(api_1.classes.active);
                        }
                    }
                }
            });
        }
        sidebarDocked() {
            this.toolbar.addClass(api_1.classes.docked);
            for (let btn of this.buttons) {
                if (btn.hasClass(api_1.classes.active) && _isSwitch(btn)) {
                    this.menu.updateMenuItem(btn.dataAttr("key"), { checked: false });
                }
            }
        }
        sidebarUndocked() {
            let hasActive = false;
            for (let item of _items) {
                if (item.role !== ButtonRoles.switch) {
                    continue;
                }
                let btn = this.buttons.namedItem(item.id);
                if (btn.hasClass(api_1.classes.active)) {
                    hasActive = true;
                    this.menu.updateMenuItem(btn.dataAttr("key"), { checked: true });
                    break;
                }
            }
            if (!hasActive && _storage.previousKey) {
                let key = _storage.previousKey;
                for (let btn of this.buttons) {
                    if (btn.dataAttr("key") === key) {
                        btn.addClass(api_1.classes.active);
                        _storage[key] = true;
                        pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, true);
                        this.menu.updateMenuItem(key, { checked: true });
                        break;
                    }
                }
            }
            this.toolbar.removeClass(api_1.classes.docked);
        }
        setButtonState(e, state, key) {
            if (e.hasClass(api_1.classes.active) && !state) {
                e.removeClass(api_1.classes.active);
                setTimeout(() => pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, false));
            }
            else if (!e.hasClass(api_1.classes.active) && state) {
                e.addClass(api_1.classes.active);
                setTimeout(() => pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, true));
            }
            if (_isSwitch(e)) {
                this.menu.updateMenuItem(key, { checked: state });
            }
        }
        buttonClicked(e) {
            const key = e.dataAttr("key");
            let switchRole = _isSwitch(e);
            const toggle = (state) => {
                if (state === undefined) {
                    state = e.hasClass(api_1.classes.active);
                }
                if (state) {
                    e.removeClass(api_1.classes.active);
                    if (switchRole) {
                        _storage.previousKey = key;
                    }
                }
                else {
                    e.addClass(api_1.classes.active);
                }
                state = !state;
                _storage[key] = state;
                pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, state);
                if (switchRole) {
                    this.menu.updateMenuItem(key, { checked: state });
                }
            };
            if (!switchRole) {
                toggle();
            }
            else {
                const isDocked = this.toolbar.hasClass(api_1.classes.docked);
                for (let btn of this.buttons) {
                    if (_isSwitch(btn) && e.id !== btn.id) {
                        const key = btn.dataAttr("key");
                        if (_storage[key]) {
                            _storage[key] = false;
                        }
                        if (btn.hasClass(api_1.classes.active)) {
                            btn.removeClass("active");
                            pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, false);
                            this.menu.updateMenuItem(key, { checked: false });
                        }
                    }
                }
                if (isDocked) {
                    toggle(false);
                }
                else {
                    toggle();
                }
                if (!e.hasClass(api_1.classes.active)) {
                    pubsub_1.publish(pubsub_1.STATE_CHANGED_OFF);
                }
                else {
                    pubsub_1.publish(pubsub_1.STATE_CHANGED_ON);
                }
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=toolbar.js.map