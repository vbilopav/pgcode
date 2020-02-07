define(["require", "exports", "app/_sys/storage", "app/_sys/pubsub", "../../controls/monaco-context-menu", "app/types"], function (require, exports, storage_1, pubsub_1, monaco_context_menu_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ButtonRoles;
    (function (ButtonRoles) {
        ButtonRoles["switch"] = "switch";
        ButtonRoles["toggle"] = "toggle";
    })(ButtonRoles || (ButtonRoles = {}));
    ;
    const isInRole = (e, role) => e.dataAttr("role") === role, isSwitch = e => isInRole(e, ButtonRoles.switch), moveText = (position) => position === types_1.Position.LEFT ? "Move Toolbar to Right" : "Move Toolbar to Left";
    const storage = new storage_1.default({
        scripts: false,
        tables: false,
        views: false,
        routines: false,
        search: false,
        previousKey: types_1.keys.scripts,
        pgcode: false
    }, "state", (name, value) => {
        if (name !== "previousKey") {
            return JSON.parse(value);
        }
        return value;
    });
    const active = "active", docked = "docked", items = [
        { id: `btn-${types_1.keys.scripts}`, icon: "icon-doc-text", key: types_1.keys.scripts, label: types_1.keys.scripts, text: "Scripts", keyBinding: "Ctrl+S", role: ButtonRoles.switch },
        { id: `btn-${types_1.keys.tables}`, icon: "icon-database", key: types_1.keys.tables, label: types_1.keys.tables, text: "Tables", keyBinding: "Ctrl+T", role: ButtonRoles.switch },
        { id: `btn-${types_1.keys.views}`, icon: "icon-database", key: types_1.keys.views, label: types_1.keys.views, text: "Views", keyBinding: "Ctrl+V", role: ButtonRoles.switch },
        { id: `btn-${types_1.keys.routines}`, icon: "icon-database", key: types_1.keys.routines, label: types_1.keys.routines, text: "Routines", keyBinding: "Ctrl+R", role: ButtonRoles.switch },
        { id: `btn-${types_1.keys.search}`, icon: "icon-search", key: types_1.keys.search, label: types_1.keys.search, text: "Search", keyBinding: "Ctrl+F", role: ButtonRoles.switch },
    ];
    class default_1 {
        constructor(element, position, index) {
            let html = "";
            let menuItems = new Array();
            for (let item of items) {
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
            if (position === types_1.Position.RIGHT) {
                this.toolbar.addClass("right");
            }
            menuItems.push({ splitter: true }, {
                id: "move",
                text: moveText(position),
                action: () => {
                    let newPosition = position == types_1.Position.LEFT ? types_1.Position.RIGHT : types_1.Position.LEFT;
                    if (index.moveToolbar(newPosition)) {
                        position = newPosition;
                        if (position === types_1.Position.RIGHT) {
                            this.toolbar.addClass("right");
                        }
                        else {
                            this.toolbar.removeClass("right");
                        }
                        this.menu.updateMenuItem("move", { text: moveText(position) });
                    }
                }
            });
            this.menu = new monaco_context_menu_1.default({ id: "ctx-menu-toolbar", items: menuItems, target: element });
            this.buttons = this.toolbar.children.on("click", (e) => this.buttonClicked(e.currentTarget));
            for (let e of this.buttons) {
                const key = e.dataAttr("key");
                this.setButtonState(e, storage[key], key);
            }
            pubsub_1.subscribe(pubsub_1.SIDEBAR_DOCKED, () => this.sidebarDocked());
            pubsub_1.subscribe(pubsub_1.SIDEBAR_UNDOCKED, () => this.sidebarUndocked());
        }
        sidebarDocked() {
            this.toolbar.addClass(docked);
            for (let btn of this.buttons) {
                if (btn.hasClass(active) && isSwitch(btn)) {
                    this.menu.updateMenuItem(btn.dataAttr("key"), { checked: false });
                }
            }
        }
        sidebarUndocked() {
            let hasActive = false;
            for (let item of items) {
                if (item.role !== ButtonRoles.switch) {
                    continue;
                }
                let btn = this.buttons.namedItem(item.id);
                if (btn.hasClass(active)) {
                    hasActive = true;
                    this.menu.updateMenuItem(btn.dataAttr("key"), { checked: true });
                    break;
                }
            }
            if (!hasActive && storage.previousKey) {
                let key = storage.previousKey;
                for (let btn of this.buttons) {
                    if (btn.dataAttr("key") === key) {
                        btn.addClass(active);
                        storage[key] = true;
                        pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, true);
                        this.menu.updateMenuItem(key, { checked: true });
                        break;
                    }
                }
            }
            this.toolbar.removeClass(docked);
        }
        setButtonState(e, state, key) {
            if (e.hasClass(active) && !state) {
                e.removeClass(active);
                setTimeout(() => pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, false), 0);
            }
            else if (!e.hasClass(active) && state) {
                e.addClass(active);
                setTimeout(() => pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, true), 0);
            }
            if (isSwitch(e)) {
                this.menu.updateMenuItem(key, { checked: state });
            }
        }
        buttonClicked(e) {
            const key = e.dataAttr("key");
            let switchRole = isSwitch(e);
            const toggle = (state) => {
                if (state === undefined) {
                    state = e.hasClass(active);
                }
                if (state) {
                    e.removeClass(active);
                    if (switchRole) {
                        storage.previousKey = key;
                    }
                }
                else {
                    e.addClass(active);
                }
                state = !state;
                storage[key] = state;
                pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, state);
                if (switchRole) {
                    this.menu.updateMenuItem(key, { checked: state });
                }
            };
            if (!switchRole) {
                toggle();
            }
            else {
                const isDocked = this.toolbar.hasClass(docked);
                for (let btn of this.buttons) {
                    if (isSwitch(btn) && e.id !== btn.id) {
                        const key = btn.dataAttr("key");
                        if (storage[key]) {
                            storage[key] = false;
                        }
                        if (btn.hasClass(active)) {
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
                if (!e.hasClass(active)) {
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