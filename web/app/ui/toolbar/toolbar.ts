import Storage from "app/_sys/storage";
import { 
    publish, subscribe, 
    STATE_CHANGED_ON, STATE_CHANGED_OFF, STATE_CHANGED, SIDEBAR_DOCKED, SIDEBAR_UNDOCKED
} from "app/_sys/pubsub";
import { ContextMenuCtorArgs, MenuItemType } from "app/controls/context-menu";
import MonacoContextMenu from "../../controls/monaco-context-menu";
import { Position, IMain } from "app/types";

enum ButtonRoles { switch="switch", toggle="toggle" };
const 
    isInRole: (e: Element, role: ButtonRoles) => boolean = (e, role) => e.dataAttr("role") === role,
    isSwitch: (e: Element) => boolean = e => isInRole(e, ButtonRoles.switch),
    moveText = (position: Position) => position === Position.LEFT ? "Move Toolbar to Right" : "Move Toolbar to Left";

interface IStorage {
    scripts: boolean;
    tables: boolean;
    views: boolean;
    funcs: boolean;
    search: boolean;
    previousKey: string;
    pgcode: boolean;
}

const 
    storage = new Storage({
        scripts: false, 
        tables: false, 
        views: false,
        funcs: false, 
        search: false, 
        previousKey: "scripts", 
        pgcode: false
    }, 
    "state", 
    (name, value) => {
        if (name !== "previousKey") {
            return JSON.parse(value) as boolean;
        }
        return value;
    }) as any as IStorage;

const 
    active = "active", 
    docked = "docked",
    items = [
        {id: "btn-scripts", icon: "icon-doc-text", key: "scripts", label: "scripts", text: "Scripts", keyBinding: "Ctrl+S", role: ButtonRoles.switch},
        {id: "btn-tables", icon: "icon-database", key: "tables", label: "tables", text: "Tables", keyBinding: "Ctrl+T", role: ButtonRoles.switch},
        {id: "btn-views", icon: "icon-database", key: "views", label: "views", text: "Views", keyBinding: "Ctrl+V", role: ButtonRoles.switch},
        {id: "btn-funcs", icon: "icon-database", key: "funcs", label: "routines", text: "Routines", keyBinding: "Ctrl+R", role: ButtonRoles.switch},
        {id: "btn-search", icon: "icon-search", key: "search", label: "search", text: "Search", keyBinding: "Ctrl+F", role: ButtonRoles.switch},
        //{id: "btn-pgcode", icon: "icon-terminal", key: "pgcode", label: "pgcode", text: null, keyBinding: null, role: ButtonRoles.toggle}
    ];

export default class  {
    private buttons: HTMLCollection;
    private toolbar: Element;
    private menu: MonacoContextMenu;

    constructor(element: Element, position: Position, index: IMain) {
        let html = "";
        let menuItems = new Array<MenuItemType>();
        for(let item of items) {
            html = html + String.html`
            <div class="${item.icon} ${item.id}" id="${item.id}" data-key="${item.key}" data-role="${item.role}" title="${item.label} (${item.keyBinding})">
                <div class="marker"></div>
                <div class="lbl">${item.label}</div>
            </div>`;
            if (item.text) {
                menuItems.push({
                    id: item.key,
                    text: item.text,
                    keyBindingsInfo: item.keyBinding,
                    action: () => element.find("#" + item.id).trigger("click")
                } as MenuItemType);
            }
        }
        this.toolbar = element.addClass("toolbar").html(html);
        if (position === Position.RIGHT) {
            this.toolbar.addClass("right");
        }

        menuItems.push({ splitter: true }, {
            id: "move", 
            text: moveText(position), 
            action: () => {
                let newPosition = position == Position.LEFT ? Position.RIGHT : Position.LEFT;
                if (index.moveToolbar(newPosition)) {
                    position = newPosition;
                    if (position === Position.RIGHT) {
                        this.toolbar.addClass("right");
                    } else {
                        this.toolbar.removeClass("right");
                    }
                    this.menu.updateMenuItem("move", {text: moveText(position)});
                }
            }
        } as MenuItemType);
        this.menu = new MonacoContextMenu({id: "ctx-menu-toolbar", items: menuItems, target: element} as ContextMenuCtorArgs);
        
        this.buttons = this.toolbar.children.on("click", (e: Event) => this.buttonClicked(e.currentTarget as HTMLElement));
        
        for(let e of this.buttons) {
            const key = e.dataAttr("key");
            this.setButtonState(e as HTMLElement, storage[key], key);
        }

        subscribe(SIDEBAR_DOCKED, () => this.sidebarDocked());
        subscribe(SIDEBAR_UNDOCKED, () => this.sidebarUndocked());
    }

    private sidebarDocked() {
        this.toolbar.addClass(docked);
        for(let btn of this.buttons) {
            if (btn.hasClass(active) && isSwitch(btn)) {
                this.menu.updateMenuItem(btn.dataAttr("key"), {checked: false});
            }
        }
    }

    private sidebarUndocked() {
        let hasActive = false
        for(let item of items) {
            if (item.role !== ButtonRoles.switch) {
                continue;
            }
            let btn = this.buttons.namedItem(item.id);
            if (btn.hasClass(active)) {
                hasActive = true;
                this.menu.updateMenuItem(btn.dataAttr("key"), {checked: true});
                break;
            }
        }
        if (!hasActive && storage.previousKey) {
            let key = storage.previousKey;
            for(let btn of this.buttons) {
                if (btn.dataAttr("key") === key) {
                    btn.addClass(active);
                    storage[key] = true;
                    publish(STATE_CHANGED + key, key, true);
                    this.menu.updateMenuItem(key, {checked: true});
                    break;
                }
            }
        }
        this.toolbar.removeClass(docked);
    } 

    private setButtonState(e: HTMLElement, state: boolean, key: string) {
        if (e.hasClass(active) && !state) {
            e.removeClass(active);
            setTimeout(() => publish(STATE_CHANGED + key, key, false), 0);
        } else if (!e.hasClass(active) && state) {
            e.addClass(active);
            setTimeout(() => publish(STATE_CHANGED + key, key, true), 0);
        }
        if (isSwitch(e)) {
            this.menu.updateMenuItem(key, {checked: state});
        }
    }

    private buttonClicked(e: HTMLElement) {
        const key = e.dataAttr("key");
        let switchRole = isSwitch(e);
        
        const toggle = (state?: boolean): void => {
            if (state === undefined) {
                state = e.hasClass(active);
            }
            if (state) {
                e.removeClass(active);
                if (switchRole) {
                    storage.previousKey = key;
                }
            } else {
                e.addClass(active);
            }
            state = !state;
            storage[key] = state;
            publish(STATE_CHANGED + key, key, state);
            if (switchRole) {
                this.menu.updateMenuItem(key, {checked: state});
            }
        };

        if (!switchRole) {
            toggle();
        } else {
            const isDocked = this.toolbar.hasClass(docked);

            for(let btn of this.buttons) {
                if (isSwitch(btn) && e.id !== btn.id) {
                    const key = btn.dataAttr("key");
                    if (storage[key]) {
                        storage[key] = false;
                    }
                    if (btn.hasClass(active)) {
                        btn.removeClass("active");
                        publish(STATE_CHANGED + key, key, false);
                        this.menu.updateMenuItem(key, {checked: false});
                    }
                }
            }
            if (isDocked) {
                toggle(false);
            } else {
                toggle();
            }

            if (!e.hasClass(active)) {
                publish(STATE_CHANGED_OFF);
            } else {
                publish(STATE_CHANGED_ON);
            }
        }
    }
}