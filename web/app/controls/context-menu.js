define(["require", "exports", "app/_sys/pubsub"], function (require, exports, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ContextMenu {
        constructor({ id, items, target, menuItemsCallback = items => items, }) {
            this.items = items;
            let element = document.body.find("#" + id);
            if (!element.length) {
                element = this.menuElement(id);
                document.body.append(element);
            }
            const container = element.find(".actions-container");
            const splitter = this.menuSplitterElement();
            const clear = () => {
                element.hideElement();
                container.html("");
            };
            for (let item of this.items) {
                let menuItem = item;
                if (item.splitter) {
                    item.element = splitter;
                    continue;
                }
                item.element = this.menuItemElement(menuItem.text, menuItem.keyBindingsInfo).on("click", () => {
                    menuItem.action(menuItem.args);
                });
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
                for (let item of menuItemsCallback(items)) {
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
            for (let item of this.items) {
                if (item.id === id) {
                    item.action(args);
                }
            }
        }
    }
    class MonacoContextMenu extends ContextMenu {
        menuElement(id) {
            return String.html `
            <div id="${id}" class="vs-dark" style="display: none; position: absolute;">
                <div class="context-view monaco-menu-container" aria-hidden="false">
                    <div class="monaco-menu">
                        <div class="monaco-action-bar animated vertical">
                            <ul class="actions-container" role="menubar"></ul>
                        </div>
                    </div>
                </div>
            </div>
        `.toElement();
        }
        menuSplitterElement() {
            return String.html `
            <li class="action-item disabled" role="presentation">
                <a class="action-label icon separator disabled" role="presentation"></a>
            </li>`.toElement();
        }
        menuItemElement(text, keyBindingsInfo) {
            return String.html `
            <li class="action-item" role="presentation">
                <a class="action-label" role="menuitem" tabindex="0">${text}</a>
                ${keyBindingsInfo ? '<span class="keybinding">' + keyBindingsInfo + '</span>' : ""}
            </li>`.toElement();
        }
    }
    exports.MonacoContextMenu = MonacoContextMenu;
});
//# sourceMappingURL=context-menu.js.map