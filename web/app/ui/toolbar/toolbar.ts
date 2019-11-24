import Storage from "app/_sys/storage";

enum ButtonRoles { switch="switch", toggle="toggle" };
const isInRole: (e: Element, role: ButtonRoles) => boolean = (e, role) => e.dataAttr("role") === role;

interface IStorage {
    btnDocs: boolean;
    btnTables: boolean;
    btnViews: boolean;
    btnFuncs: boolean;
    btnSearch: boolean;
    btnTerminal: boolean;
}

const storage = new Storage(
    {btnDocs: false, btnTables: false, btnViews: false, btnFuncs: false, btnSearch: false, btnTerminal: false}, 
    "toolbar") as any as IStorage;

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
        
        this.buttons = element.children.on("click", (e: Event) => this.buttonClicked(e));

        for(let e of this.buttons) {
            this[e.id.toCamelCase()] = e;
        }
    }

    private buttonClicked(event: Event) {
        const e = event.target as HTMLElement;
        const active = "active";

        if (e.dataAttr("role") === undefined) {
            console.log("publish", `/menu/on/${e.id.toCamelCase()}`);
            return;
        }

        const toggle = (): void => {
            if (e.hasClass(active)) {
                e.removeClass(active);
                console.log("publish", `/button/changed/off/${e.id.toCamelCase()}`);
            } else {
                e.addClass(active);
                console.log("publish", `/button/changed/on/${e.id.toCamelCase()}`);
            }
        };
        
        if (isInRole(e, ButtonRoles.toggle)) {
            toggle();
        } else {
            for(let btn of this.buttons) {
                if (isInRole(btn, ButtonRoles.switch) && btn.hasClass(active) && e.id !== btn.id) {
                    btn.removeClass("active");
                    console.log("publish", `/button/changed/off/${btn.id.toCamelCase()}`);
                }
            }
            toggle();
        }
    }
}