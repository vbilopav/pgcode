import Storage from "app/_sys/storage";
import { 
    publish, subscribe, 
    STATE_CHANGED_ON, STATE_CHANGED_OFF, STATE_CHANGED, SIDEBAR_DOCKED, SIDEBAR_UNDOCKED
} from "app/_sys/pubsub";

enum ButtonRoles { switch="switch", toggle="toggle" };
const isInRole: (e: Element, role: ButtonRoles) => boolean = (e, role) => e.dataAttr("role") === role;

const 
    active = "active", 
    docked = "docked";

interface IStorage {
    docs: boolean;
    tables: boolean;
    views: boolean;
    funcs: boolean;
    search: boolean;
    terminal: boolean;
}

const storage = new Storage(
    {docs: false, tables: false, views: false, funcs: false, search: false, terminal: false}, 
    "state", 
    (name, value) => JSON.parse(value) as boolean
) as any as IStorage;

export default class  {
    private buttons: HTMLCollection;
    private toolbar: Element;

    constructor(element: Element){
        this.toolbar = element.addClass("toolbar").html(String.html`
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
            <div class="icon-terminal btn-pgcode" id="btn-terminal" data-key="terminal" data-role="${ButtonRoles.toggle}">
                <div class="marker"></div>
                <div class="lbl">pgcode</div>
            </div>
        `);
        
        this.buttons = element.children.on("click", (e: Event) => this.buttonClicked(e.currentTarget as HTMLElement));

        for(let e of this.buttons) {
            const key = e.dataAttr("key");
            this.setButtonState(e as HTMLElement, storage[key], key);
        }

        subscribe(SIDEBAR_DOCKED, () => this.toolbar.addClass(docked));
        subscribe(SIDEBAR_UNDOCKED, () => this.toolbar.removeClass(docked));
    }

    private setButtonState(e: HTMLElement, state: boolean, key: string) {
        if (e.hasClass(active) && !state) {
            e.removeClass(active);
            setTimeout(() => publish(STATE_CHANGED + key, key, false), 0);
        } else if (!e.hasClass(active) && state) {
            e.addClass(active);
            setTimeout(() => publish(STATE_CHANGED + key, key, true), 0);
        }
    }

    private buttonClicked(e: HTMLElement) {
        const key = e.dataAttr("key");
        const toggle = (state?: boolean): void => {
            if (state === undefined) {
                state = e.hasClass(active);
            }
            if (state) {
                e.removeClass(active);
                storage[key] = false;
                publish(STATE_CHANGED + key, key, false);
            } else {
                e.addClass(active);
                storage[key] = true;
                publish(STATE_CHANGED + key, key, true);
            }
        };

        if (isInRole(e, ButtonRoles.toggle)) {
            toggle();
        } else {
            const isDocked = this.toolbar.hasClass(docked);

            for(let btn of this.buttons) {
                if (isInRole(btn, ButtonRoles.switch) && e.id !== btn.id) {
                    const key = btn.dataAttr("key");
                    if (storage[key]) {
                        storage[key] = false;
                    }
                    if (btn.hasClass(active)) {
                        btn.removeClass("active");
                        publish(STATE_CHANGED + key, key, false);
                    }
                }
            }
            if (isDocked) {
                toggle(false);
                publish(STATE_CHANGED_ON);
            } else {
                toggle();
                if (!e.hasClass(active)) {
                    publish(STATE_CHANGED_OFF);
                }
            }
        }
    }
}