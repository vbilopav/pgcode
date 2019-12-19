define(["require", "exports", "app/_sys/storage", "app/_sys/pubsub", "app/controls/context-menu"], function (require, exports, storage_1, pubsub_1, context_menu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ButtonRoles;
    (function (ButtonRoles) {
        ButtonRoles["switch"] = "switch";
        ButtonRoles["toggle"] = "toggle";
    })(ButtonRoles || (ButtonRoles = {}));
    ;
    const isInRole = (e, role) => e.dataAttr("role") === role;
    const storage = new storage_1.default({ docs: false, tables: false, views: false, funcs: false, search: false, terminal: false }, "state", (name, value) => JSON.parse(value));
    const active = "active", docked = "docked", items = [
        { id: "btn-docs", icon: "icon-doc-text", key: "docs", label: "scripts", text: "Scripts", keyBinding: "Ctrl+S", role: ButtonRoles.switch },
        { id: "btn-tables", icon: "icon-database", key: "tables", label: "tables", text: "Tables", keyBinding: "Ctrl+T", role: ButtonRoles.switch },
        { id: "btn-views", icon: "icon-database", key: "views", label: "views", text: "Views", keyBinding: "Ctrl+V", role: ButtonRoles.switch },
        { id: "btn-funcs", icon: "icon-database", key: "funcs", label: "routines", text: "Routines", keyBinding: "Ctrl+R", role: ButtonRoles.switch },
        { id: "btn-search", icon: "icon-search", key: "search", label: "search", text: "Search", keyBinding: "Ctrl+F", role: ButtonRoles.switch },
        { id: "btn-pgcode", icon: "icon-terminal", key: "pgcode", label: "pgcode", text: null, keyBinding: null, role: ButtonRoles.toggle }
    ];
    class default_1 {
        constructor(element) {
            let html = "";
            let menuItems = new Array();
            for (let item of items) {
                html = html + String.html `
            <div class="${item.icon} ${item.id}" id="${item.id}" data-key="${item.key}" data-role="${item.role}">
                <div class="marker"></div>
                <div class="lbl">${item.label}</div>
            </div>
            `;
                if (item.text) {
                    menuItems.push({
                        id: item.key,
                        text: item.text,
                        keyBindingsInfo: item.keyBinding
                    });
                }
            }
            this.toolbar = element.addClass("toolbar").html(html);
            menuItems.push({
                splitter: true
            }, {
                id: "move",
                text: "Move Toolbar to Right"
            });
            this.menu = new context_menu_1.MonacoContextMenu({ id: "ctx-menu-toolbar", items: menuItems, target: element });
            this.buttons = this.toolbar.children.on("click", (e) => this.buttonClicked(e.currentTarget));
            for (let e of this.buttons) {
                const key = e.dataAttr("key");
                this.setButtonState(e, storage[key], key);
            }
            pubsub_1.subscribe(pubsub_1.SIDEBAR_DOCKED, () => this.toolbar.addClass(docked));
            pubsub_1.subscribe(pubsub_1.SIDEBAR_UNDOCKED, () => this.toolbar.removeClass(docked));
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
        }
        buttonClicked(e) {
            const key = e.dataAttr("key");
            const toggle = (state) => {
                if (state === undefined) {
                    state = e.hasClass(active);
                }
                if (state) {
                    e.removeClass(active);
                    storage[key] = false;
                    pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, false);
                }
                else {
                    e.addClass(active);
                    storage[key] = true;
                    pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, true);
                }
            };
            if (isInRole(e, ButtonRoles.toggle)) {
                toggle();
            }
            else {
                const isDocked = this.toolbar.hasClass(docked);
                for (let btn of this.buttons) {
                    if (isInRole(btn, ButtonRoles.switch) && e.id !== btn.id) {
                        const key = btn.dataAttr("key");
                        if (storage[key]) {
                            storage[key] = false;
                        }
                        if (btn.hasClass(active)) {
                            btn.removeClass("active");
                            pubsub_1.publish(pubsub_1.STATE_CHANGED + key, key, false);
                        }
                    }
                }
                if (isDocked) {
                    toggle(false);
                    pubsub_1.publish(pubsub_1.STATE_CHANGED_ON);
                }
                else {
                    toggle();
                    if (!e.hasClass(active)) {
                        pubsub_1.publish(pubsub_1.STATE_CHANGED_OFF);
                    }
                }
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=toolbar.js.map