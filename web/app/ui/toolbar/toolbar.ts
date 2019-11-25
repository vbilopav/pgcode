import Storage from "app/_sys/storage";
import { publish, STATE_CHANGED_ON, STATE_CHANGED_OFF, STATE_CHANGED, } from "app/_sys/pubsub";

enum ButtonRoles { switch="switch", toggle="toggle" };
const isInRole: (e: Element, role: ButtonRoles) => boolean = (e, role) => e.dataAttr("role") === role;
const active = "active";

interface IStorage {
    docs: boolean;
    tables: boolean;
    views: boolean;
    funcs: boolean;
    search: boolean;
    terminal: boolean;
}

const storage = new Storage({
    docs: false, tables: false, views: false, funcs: false, search: false, terminal: false
}, 
"state", 
(name, value) => JSON.parse(value) as boolean) as any as IStorage;

export default class  {
    private buttons: HTMLCollection;
    /*
    private schemaMenu: Element;
    private btnDocs: Element;
    private btnTables: Element;
    private btnViews: Element;
    private btnFuncs: Element;
    private btnSearch: Element;
    private btnTerminal: Element;
    */

    constructor(element: Element){
        element.addClass("toolbar").html(String.html`
            <div class="select-schema" id="schema-menu">
                public
            </div>
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
            <div class="icon-terminal btn-psql" id="btn-terminal" data-key="terminal" data-role="${ButtonRoles.toggle}">
                <div class="marker"></div>
                <div class="lbl">psql</div>
            </div>
        `);
        
        this.buttons = element.children.on("click", (e: Event) => this.buttonClicked(e.currentTarget as HTMLElement));

        for(let e of this.buttons) {
            const key = e.dataAttr("key");
            this.setButtonState(e as HTMLElement, storage[key], key);
        }
    }

    private setButtonState(e: HTMLElement, state: boolean, key: string) {
        if (e.hasClass(active) && !state) {
            e.removeClass(active);
            setTimeout(() => publish([STATE_CHANGED_OFF, STATE_CHANGED], key, false), 0);
        } else if (!e.hasClass(active) && state) {
            e.addClass(active);
            setTimeout(() => publish([STATE_CHANGED_ON, STATE_CHANGED], key, true), 0);
        }
    }

    private buttonClicked(e: HTMLElement) {
        const key = e.dataAttr("key");

        if (e.dataAttr("role") === undefined) {
            // open schema menu
            return;
        }

        const toggle = (): void => {
            if (e.hasClass(active)) {
                e.removeClass(active);
                storage[key] = false;
                publish([STATE_CHANGED_OFF, STATE_CHANGED], key, false);
            } else {
                e.addClass(active);
                storage[key] = true;
                publish([STATE_CHANGED_ON, STATE_CHANGED], key, true);
            }
        };
        
        if (isInRole(e, ButtonRoles.toggle)) {
            toggle();
        } else {
            for(let btn of this.buttons) {
                if (isInRole(btn, ButtonRoles.switch) && e.id !== btn.id) {
                    const key = btn.dataAttr("key");
                    if (storage[key]) {
                        storage[key] = false;
                    }
                    if (btn.hasClass(active)) {
                        btn.removeClass("active");
                        publish([STATE_CHANGED_OFF, STATE_CHANGED], key, false);
                    }
                }
            }
            toggle();
        }
    }
}