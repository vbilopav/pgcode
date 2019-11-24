import Storage from "app/_sys/storage";
import { publish, BUTTON_CHANGED_OFF, BUTTON_CHANGED_ON } from "app/_sys/pubsub";

enum ButtonRoles { switch="switch", toggle="toggle" };
const isInRole: (e: Element, role: ButtonRoles) => boolean = (e, role) => e.dataAttr("role") === role;
const active = "active";

interface IStorage {
    btnDocs: boolean;
    btnTables: boolean;
    btnViews: boolean;
    btnFuncs: boolean;
    btnSearch: boolean;
    btnTerminal: boolean;
}

const storage = new Storage(
    {
        btnDocs: false, btnTables: false, btnViews: false, btnFuncs: false, btnSearch: false, btnTerminal: false
    }, 
    "toolbar",
    (name, value) => JSON.parse(value) as boolean) as any as IStorage;

export default class  {
    private buttons: HTMLCollection;
    private schemaMenu: Element;
    private btnDocs: Element;
    private btnTables: Element;
    private btnViews: Element;
    private btnFuncs: Element;
    private btnSearch: Element;
    private btnTerminal: Element;

    constructor(element: Element){
        element.addClass("toolbar").html(String.html`
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
        
        this.buttons = element.children.on("click", (e: Event) => this.buttonClicked(e.currentTarget as HTMLElement));

        for(let e of this.buttons) {
            const name = e.id.toCamelCase();
            this[e.id.toCamelCase()] = e;
            this.setButtonState(this[name], storage[name]);
        }
    }

    private setButtonState(e: HTMLElement, state: boolean) {
        const name = e.id.toCamelCase();
        if (e.hasClass(active) && !state) {
            e.removeClass(active);
            publish(BUTTON_CHANGED_OFF(name));
        } else if (!e.hasClass(active) && state) {
            e.addClass(active);
            publish(BUTTON_CHANGED_ON(name));
        }
    }

    private buttonClicked(e: HTMLElement) {
        const name = e.id.toCamelCase();

        if (e.dataAttr("role") === undefined) {
            //console.log("publish", `/menu/on/${name}`);
            return;
        }

        const toggle = (): void => {
            if (e.hasClass(active)) {
                e.removeClass(active);
                storage[name] = false;
                publish(BUTTON_CHANGED_OFF(name));
            } else {
                e.addClass(active);
                storage[name] = true;
                publish(BUTTON_CHANGED_ON(name));
            }
        };
        
        if (isInRole(e, ButtonRoles.toggle)) {
            toggle();
        } else {
            for(let btn of this.buttons) {
                if (isInRole(btn, ButtonRoles.switch) && e.id !== btn.id) {
                    const name = btn.id.toCamelCase();
                    if (storage[name]) {
                        storage[name] = false;
                    }
                    if (btn.hasClass(active)) {
                        btn.removeClass("active");
                        publish(BUTTON_CHANGED_OFF(name));
                    }
                }
            }
            toggle();
        }
    }
}