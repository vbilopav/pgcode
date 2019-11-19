define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const isToggle = e => e.dataAttr("toggle") === "1";
    class default_1 {
        constructor(element) {
            element.addClass("toolbar").html(String.html `
            <div class="select-schema" data-name="schema">
                public
            </div>
            <div class="icon-doc-text btn-docs" data-name="docs" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">scripts</div>
            </div>
            <div class="icon-database btn-tables"  data-name="tables" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">tables</div>
            </div>
            <div class="icon-database btn-views"  data-name="views" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">views</div>
            </div>
            <div class="icon-database btn-funcs" data-name="funcs" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">funcs</div>
            </div>
            <div class="icon-search btn-search" data-name="search" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">search</div>
            </div>
            <div class="icon-terminal btn-psql" data-name="terminal" data-toggle="0">
                <div class="marker"></div>
                <div class="lbl">psql</div>
            </div>
        `);
            this.buttons = element.children;
            this.buttons.on("click", (event) => {
                const e = event.target;
                this.buttonClicked(e, e.dataAttr("name"), isToggle(e));
            });
        }
        buttonClicked(e, name, toggle) {
            if (!toggle) {
                e.toggleClass("active");
            }
            else {
                for (let btn of this.buttons) {
                    if (isToggle(btn) && btn.hasClass("active")) {
                        btn.removeClass("active");
                    }
                }
                e.toggleClass("active");
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=toolbar.js.map