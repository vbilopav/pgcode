define(["require", "exports", "app/_sys/pubsub"], function (require, exports, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ContextMenu {
        constructor({ id, items, target, event = "contextmenu", menuItemsCallback = items => items, onOpen = () => { }, onClose = () => { } }) {
            this.element = document.body.find("#" + id);
            if (!this.element.length) {
                this.element = this.menuElement(id);
                document.body.append(this.element);
            }
            this.actions = this.getActionsContainerElement(this.element);
            this.onClose = onClose;
            this.items = {};
            let count = 0;
            for (let item of items) {
                item.order = count++;
                this.updateItemElement(item);
                let menuItem = item;
                this.items[!menuItem.id ? count.toString() : menuItem.id] = item;
            }
            this.element.on("click", () => this.close());
            window.on("resize", () => this.close());
            window.on("mousedown", (e) => {
                let path = e.composedPath();
                if ((!path.includes(this.element) && !path.includes(this.target) && event === "click") || (!path.includes(this.element) && event !== "click")) {
                    this.close();
                }
            }).on("keyup", (e) => {
                if (e.keyCode === 27) {
                    this.close();
                }
            });
            this.target = target.on(event, (e) => {
                if (this.isVisible) {
                    this.close();
                    return;
                }
                this.actions.html("");
                for (let item of menuItemsCallback(Object.values(this.items).sort((a, b) => a.order - b.order))) {
                    this.actions.append(item.element);
                }
                this.adjust(e);
                e.preventDefault();
                onOpen();
            });
            pubsub_1.subscribe(pubsub_1.CLOSE_CONTEXT_MENU, () => this.close());
        }
        menuSplitterElement() { return new Element(); }
        ;
        close() {
            if (!this.isVisible) {
                return;
            }
            this.element.hideElement();
            this.actions.html("");
            this.onClose();
        }
        triggerById(id, args) {
            const item = this.items[id];
            if (item) {
                item.action(args);
            }
        }
        updateMenuItem(id, data) {
            const item = this.items[id];
            const newItem = { ...(item ? item : {}), ...data };
            this.updateItemElement(newItem);
            this.items[id] = newItem;
            return this;
        }
        adjust(e) {
            this.element.css("top", e.y + "px").css("left", e.x + "px").visible(false).showElement();
            const rect = this.actions.getBoundingClientRect(), winWidth = window.innerWidth, winHeight = window.innerHeight, right = e.x + rect.width, bottom = rect.top + rect.height;
            if (right >= (winWidth + 1)) {
                let left = (winWidth - rect.width - 1);
                this.element.css("left", (left > 0 ? left : 0) + "px");
            }
            if (bottom >= (winHeight + 1)) {
                let top = e.y - rect.height - 1;
                this.element.css("top", (top > 0 ? top : 0) + "px");
            }
            this.element.visible(true);
        }
        getActionsContainerElement(element) {
            return element;
        }
        get isVisible() {
            if (this.actions.childNodes.length === 1 && this.actions.childNodes[0].nodeType === Node.TEXT_NODE) {
                return false;
            }
            return this.element.css("display") !== "none" && this.actions.childNodes.length !== 0;
        }
        updateItemElement(item) {
            let menuItem = item;
            if (item.splitter) {
                item.element = this.menuSplitterElement();
            }
            else {
                item.element = this.menuItemElement(menuItem).on("click", () => {
                    menuItem.action(menuItem.args);
                });
            }
        }
    }
    exports.ContextMenu = ContextMenu;
});
//# sourceMappingURL=context-menu.js.map