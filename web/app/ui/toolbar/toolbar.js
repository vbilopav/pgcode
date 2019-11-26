define(["require", "exports", "app/_sys/storage", "app/_sys/pubsub"], function (require, exports, storage_1, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ButtonRoles;
    (function (ButtonRoles) {
        ButtonRoles["switch"] = "switch";
        ButtonRoles["toggle"] = "toggle";
    })(ButtonRoles || (ButtonRoles = {}));
    ;
    const isInRole = (e, role) => e.dataAttr("role") === role;
    const active = "active";
    const storage = new storage_1.default({ docs: false, tables: false, views: false, funcs: false, search: false, terminal: false }, "state", (name, value) => JSON.parse(value));
    class default_1 {
        constructor(element) {
            element.addClass("toolbar").html(String.html `
            <div class="select-schema" id="schema-menu">
                public
            </div>
            <div class="icon-doc-text btn-docs" id="btn-docs" data-key="docs" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">scripts</div>
            </div>
            <div class="icon-database btn-tables" id="btn-tables" data-key="tables" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">tables</div>
            </div>
            <div class="icon-database btn-views" id="btn-views" data-key="views" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">views</div>
            </div>
            <div class="icon-database btn-funcs" id="btn-funcs" data-key="funcs" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">funcs</div>
            </div>
            <div class="icon-search btn-search" id="btn-search" data-key="search" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">search</div>
            </div>
            <div class="icon-terminal btn-psql" id="btn-terminal" data-key="terminal" data-role="${ButtonRoles.toggle}">
                <div class="marker"></div>
                <div class="lbl">psql</div>
            </div>
        `);
            this.buttons = element.children.on("click", (e) => this.buttonClicked(e.currentTarget));
            for (let e of this.buttons) {
                const key = e.dataAttr("key");
                this.setButtonState(e, storage[key], key);
            }
        }
        setButtonState(e, state, key) {
            if (e.hasClass(active) && !state) {
                e.removeClass(active);
                setTimeout(() => pubsub_1.publish([pubsub_1.STATE_CHANGED_OFF, pubsub_1.STATE_CHANGED, pubsub_1.STATE_CHANGED + key], key, false), 0);
            }
            else if (!e.hasClass(active) && state) {
                e.addClass(active);
                setTimeout(() => pubsub_1.publish([pubsub_1.STATE_CHANGED_ON, pubsub_1.STATE_CHANGED, pubsub_1.STATE_CHANGED + key], key, true), 0);
            }
        }
        buttonClicked(e) {
            const key = e.dataAttr("key");
            if (e.dataAttr("role") === undefined) {
                return;
            }
            const toggle = () => {
                if (e.hasClass(active)) {
                    e.removeClass(active);
                    storage[key] = false;
                    pubsub_1.publish([pubsub_1.STATE_CHANGED_OFF, pubsub_1.STATE_CHANGED, pubsub_1.STATE_CHANGED + key], key, false);
                }
                else {
                    e.addClass(active);
                    storage[key] = true;
                    pubsub_1.publish([pubsub_1.STATE_CHANGED_ON, pubsub_1.STATE_CHANGED, pubsub_1.STATE_CHANGED + key], key, true);
                }
            };
            if (isInRole(e, ButtonRoles.toggle)) {
                toggle();
            }
            else {
                for (let btn of this.buttons) {
                    if (isInRole(btn, ButtonRoles.switch) && e.id !== btn.id) {
                        const key = btn.dataAttr("key");
                        if (storage[key]) {
                            storage[key] = false;
                        }
                        if (btn.hasClass(active)) {
                            btn.removeClass("active");
                            pubsub_1.publish([pubsub_1.STATE_CHANGED_OFF, pubsub_1.STATE_CHANGED, pubsub_1.STATE_CHANGED + key], key, false);
                        }
                    }
                }
                toggle();
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=toolbar.js.map