define(["require", "exports", "app/_sys/pubsub", "app/controls/monaco-context-menu"], function (require, exports, pubsub_1, monaco_context_menu_1) {
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
        constructor(element, key, menuItems = []) {
            this.element = element;
            this.key = key;
            this.header = element.children[0].html(String.html `
            <div>${key.toUpperCase()}</div>
            <div>
                <span class="btn"><i class="icon-menu"></i></span>
            </div>
        `);
            this.items = element.children[1];
            this.initiateToggleShadow();
            this.initPanelMenu(menuItems);
            this.items.on("click", e => this.itemsClick(e));
            pubsub_1.subscribe(pubsub_1.SCHEMA_CHANGED, (data) => this.schemaChanged(data));
        }
        show(state) {
            this.element.showElement(state);
        }
        setMainPanelRef(mainPanel) {
            this.mainPanel = mainPanel;
            return this;
        }
        createItemElement(content) {
            return String.html `
        <div class="panel-item">
            ${content}
        </div>`
                .toElement();
        }
        itemSelected(element) { }
        ;
        itemUnselected(element) { }
        ;
        publishLength() {
            pubsub_1.publish(pubsub_1.ITEM_COUNT_CHANGED, this.key, this.items.children.length);
        }
        itemsClick(e) {
            const element = e.target.closest("div.panel-item");
            if (!element) {
                return;
            }
            if (!element.hasClass("active")) {
                const active = this.items.findAll(".active");
                if (active.length > 0) {
                    for (let unselect of active) {
                        this.itemUnselected(unselect.removeClass("active"));
                    }
                }
                element.addClass("active");
                this.itemSelected(element);
            }
        }
        initPanelMenu(menuItems = []) {
            if (menuItems.length) {
                new PanelMenu({
                    id: `${this.key}-panel-menu`,
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
        initiateToggleShadow() {
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
        }
        toggleHeaderShadow() {
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            this.scrollTimeout = setTimeout(() => {
                if (this.items.scrollHeight > this.items.clientHeight && this.items.scrollTop) {
                    this.header.addClass("shadow");
                }
                else {
                    this.header.removeClass("shadow");
                }
                this.scrollTimeout = undefined;
            }, 10);
        }
    }
    exports.default = Panel;
});
//# sourceMappingURL=panel.js.map