define(["require", "exports", "app/controls/monaco-context-menu"], function (require, exports, monaco_context_menu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PanelMenu extends monaco_context_menu_1.default {
        adjust() {
            this.element.css("top", "0").css("left", "0").visible(false).showElement();
            const target = this.target.getBoundingClientRect();
            const element = this.element.getBoundingClientRect();
            let left;
            if (target.left + element.width >= window.innerWidth) {
                left = window.innerWidth - element.width;
            }
            else {
                left = target.left;
            }
            this.element.css("top", (target.top + target.height) + "px").css("left", left + "px").css("min-width", target.width + "px").visible(true);
        }
    }
    class Panel {
        constructor(element, title, menuItems = []) {
            this.element = element;
            this.header = element.children[0].html(String.html `
            <div>${title}</div>
            <div>
                <span class="btn"><i class="icon-menu"></i></span>
            </div>
        `);
            this.items = element.children[1];
            this.items.on("mouseleave", event => {
                let e = event.target;
                e.css("overflow-y", "hidden").css("z-index", "");
            }).on("mouseenter", event => {
                let e = event.target;
                if (e.scrollHeight > e.clientHeight) {
                    e.css("overflow-y", "scroll").css("z-index", "1");
                }
            }).on("scroll", () => this.toggleHeaderShadow());
            this.toggleHeaderShadow();
            if (menuItems.length) {
                new PanelMenu({
                    id: "scripts-panel-menu",
                    target: this.header.find(".btn"),
                    event: "click",
                    items: menuItems,
                    onOpen: menu => menu.target.addClass("active"),
                    onClose: menu => menu.target.removeClass("active")
                });
            }
            else {
                this.header.find(".btn").remove();
            }
        }
        show(state) {
            this.element.showElement(state);
        }
        toggleHeaderShadow() {
            if (this.itemScrollTimeout) {
                clearTimeout(this.itemScrollTimeout);
            }
            this.itemScrollTimeout = setTimeout(() => {
                if (this.items.scrollHeight > this.items.clientHeight && this.items.scrollTop) {
                    this.header.addClass("shadow");
                }
                else {
                    this.header.removeClass("shadow");
                }
                this.itemScrollTimeout = undefined;
            }, 10);
        }
    }
    exports.default = Panel;
});
//# sourceMappingURL=panel.js.map