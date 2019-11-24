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
    const storage = new storage_1.default({
        btnDocs: false, btnTables: false, btnViews: false, btnFuncs: false, btnSearch: false, btnTerminal: false
    }, "toolbar", (name, value) => JSON.parse(value));
    class default_1 {
        constructor(element) {
            element.addClass("toolbar").html(String.html `
            <div class="select-schema" id="schema-menu">
                public
            </div>
            <div class="icon-doc-text btn-docs" id="btn-docs" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">scripts</div>
            </div>
            <div class="icon-database btn-tables" id="btn-tables" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">tables</div>
            </div>
            <div class="icon-database btn-views" id="btn-views" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">views</div>
            </div>
            <div class="icon-database btn-funcs" id="btn-funcs" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">funcs</div>
            </div>
            <div class="icon-search btn-search" id="btn-search" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">search</div>
            </div>
            <div class="icon-terminal btn-psql" id="btn-terminal" data-role="${ButtonRoles.toggle}">
                <div class="marker"></div>
                <div class="lbl">psql</div>
            </div>
        `);
            this.buttons = element.children.on("click", (e) => this.buttonClicked(e.currentTarget));
            for (let e of this.buttons) {
                const name = e.id.toCamelCase();
                this[e.id.toCamelCase()] = e;
                this.setButtonState(this[name], storage[name]);
            }
        }
        setButtonState(e, state) {
            const name = e.id.toCamelCase();
            if (e.hasClass(active) && !state) {
                e.removeClass(active);
                pubsub_1.publish(pubsub_1.BUTTON_CHANGED_OFF(name));
            }
            else if (!e.hasClass(active) && state) {
                e.addClass(active);
                pubsub_1.publish(pubsub_1.BUTTON_CHANGED_ON(name));
            }
        }
        buttonClicked(e) {
            const name = e.id.toCamelCase();
            if (e.dataAttr("role") === undefined) {
                return;
            }
            const toggle = () => {
                if (e.hasClass(active)) {
                    e.removeClass(active);
                    storage[name] = false;
                    pubsub_1.publish(pubsub_1.BUTTON_CHANGED_OFF(name));
                }
                else {
                    e.addClass(active);
                    storage[name] = true;
                    pubsub_1.publish(pubsub_1.BUTTON_CHANGED_ON(name));
                }
            };
            if (isInRole(e, ButtonRoles.toggle)) {
                toggle();
            }
            else {
                for (let btn of this.buttons) {
                    if (isInRole(btn, ButtonRoles.switch) && e.id !== btn.id) {
                        const name = btn.id.toCamelCase();
                        if (storage[name]) {
                            storage[name] = false;
                        }
                        if (btn.hasClass(active)) {
                            btn.removeClass("active");
                            pubsub_1.publish(pubsub_1.BUTTON_CHANGED_OFF(name));
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