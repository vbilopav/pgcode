
enum ButtonRoles { switch="switch", toggle="toggle" };
//const isToggle: (e: Element) => boolean = e => e.dataAttr("toggle") === "1";

interface IModel {
    schema: Element,
    docs: Element,
    tables: Element,
    views: Element,
    funcs: Element,
    search: Element,
    terminal: Element
}

export default class  {
    //private buttons: HTMLCollection;
/*
    private schemaMenu: Element;
    private btnDocs: Element;
    private btnTables: Element;
    private btnViews: Element;
    private btnFuncs: Element;
*/
    private model: IModel;

    constructor(element: Element){
        element.addClass("toolbar").html(String.html`
            <div class="select-schema" name="schema">
                public
            </div>
            <div class="icon-doc-text btn-docs" name="docs" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">scripts</div>
            </div>
            <div class="icon-database btn-tables"  name="tables" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">tables</div>
            </div>
            <div class="icon-database btn-views"  name="views" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">views</div>
            </div>
            <div class="icon-database btn-funcs" name="funcs" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">funcs</div>
            </div>
            <div class="icon-search btn-search" name="search" data-role="${ButtonRoles.switch}">
                <div class="marker"></div>
                <div class="lbl">search</div>
            </div>
            <div class="icon-terminal btn-psql" name="terminal" data-role="${ButtonRoles.toggle}">
                <div class="marker"></div>
                <div class="lbl">psql</div>
            </div>
        `);

        //this.model = new window.ihjs.Model().bind(element) as any as IModel;
/*
        this.buttons = element.children;
        this.buttons.on("click", (event: Event) => {
            const e = event.target as Element;
            this.buttonClicked(e, e.dataAttr("name"), isToggle(e));
        });
*/
    }

    /*
    private buttonClicked(e: Element, name: string, toggle: boolean) {
        if (!toggle) {
            e.toggleClass("active");
        } else {
            for(let btn of this.buttons) {
                if (isToggle(btn) && btn.hasClass("active")) {
                    btn.removeClass("active");
                }
            }
            e.toggleClass("active");
        }
    }
    */
}