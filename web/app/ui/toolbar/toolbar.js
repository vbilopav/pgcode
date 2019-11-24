define(["require", "exports", "app/_sys/storage"], function (require, exports, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ButtonRoles;
    (function (ButtonRoles) {
        ButtonRoles["switch"] = "switch";
        ButtonRoles["toggle"] = "toggle";
    })(ButtonRoles || (ButtonRoles = {}));
    ;
    const isInRole = (e, role) => e.dataAttr("role") === role;
    const storage = new storage_1.default({ btnDocs: false, btnTables: false, btnViews: false, btnFuncs: false, btnSearch: false, btnTerminal: false }, "toolbar");
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
            this.buttons = element.children.on("click", (e) => this.buttonClicked(e));
            for (let e of this.buttons) {
                this[e.id.toCamelCase()] = e;
            }
        }
        buttonClicked(event) {
            const e = event.target;
            const active = "active";
            if (e.dataAttr("role") === undefined) {
                console.log("publish", `/menu/on/${e.id.toCamelCase()}`);
                return;
            }
            const toggle = () => {
                if (e.hasClass(active)) {
                    e.removeClass(active);
                    console.log("publish", `/button/changed/off/${e.id.toCamelCase()}`);
                }
                else {
                    e.addClass(active);
                    console.log("publish", `/button/changed/on/${e.id.toCamelCase()}`);
                }
            };
            if (isInRole(e, ButtonRoles.toggle)) {
                toggle();
            }
            else {
                for (let btn of this.buttons) {
                    if (isInRole(btn, ButtonRoles.switch) && btn.hasClass(active) && e.id !== btn.id) {
                        btn.removeClass("active");
                        console.log("publish", `/button/changed/off/${btn.id.toCamelCase()}`);
                    }
                }
                toggle();
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=toolbar.js.map