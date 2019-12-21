define(["require", "exports", "app/_sys/pubsub"], function (require, exports, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ContextMenu {
        constructor({ id, items, target, menuItemsCallback = items => items, }) {
            let element = document.body.find("#" + id);
            if (!element.length) {
                element = this.menuElement(id);
                document.body.append(element);
            }
            const container = element.find("ul");
            const clear = () => {
                element.hideElement();
                container.html("");
            };
            this.items = {};
            let count = 0;
            for (let item of items) {
                item.order = count++;
                this.updateItemElement(item);
                let menuItem = item;
                this.items[!menuItem.id ? count.toString() : menuItem.id] = item;
            }
            element.on("click", () => clear());
            window.on("resize", () => clear());
            window.on("mousedown", () => {
                if (!element.find(":hover").length) {
                    clear();
                }
            }).on("keyup", (e) => {
                if (e.keyCode === 27) {
                    clear();
                }
            });
            target.on("contextmenu", (e) => {
                container.html("");
                for (let item of menuItemsCallback(Object.values(this.items).sort((a, b) => a.order - b.order))) {
                    container.append(item.element);
                }
                element.css("top", e.y + "px").css("left", e.x + "px").showElement();
                const rect = container.getBoundingClientRect(), winWidth = window.innerWidth, winHeight = window.innerHeight, right = e.x + rect.width, bottom = rect.top + rect.height;
                if (right >= winWidth) {
                    element.css("left", (winWidth - rect.width - 1) + "px");
                }
                if (bottom >= winHeight) {
                    element.css("top", (e.y - rect.height - 1) + "px");
                }
                e.preventDefault();
            });
            pubsub_1.subscribe(pubsub_1.CLOSE_CONTEXT_MENU, () => clear());
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
    class MonacoContextMenu extends ContextMenu {
        menuElement(id) {
            return String.html `
        <div id="${id}" style="display: none; position: fixed;">
            <div class="context-view monaco-menu-container pgmenu-container ">
                <div class="monaco-menu">
                    <div class="monaco-action-bar animated vertical">
                        <ul class="actions-container"></ul>
                    </div>
                </div>
            </div>
        </div>`.toElement();
        }
        menuSplitterElement() {
            return String.html `
        <li class="action-item pgaction disabled">
            <a class="action-label icon separator disabled"></a>
        </li>`.toElement();
        }
        menuItemElement(menuItem) {
            return String.html `
        <li class="action-item pgaction">
            ${menuItem.checked ? '<span class="checked">&check;</span>' : ""}
            <a class="action-label" tabindex="0">${menuItem.text}</a>
            ${menuItem.keyBindingsInfo ? '<span class="keybinding">' + menuItem.keyBindingsInfo + '</span>' : ""}
        </li>`.toElement();
        }
    }
    exports.MonacoContextMenu = MonacoContextMenu;
});
//# sourceMappingURL=context-menu.js.map