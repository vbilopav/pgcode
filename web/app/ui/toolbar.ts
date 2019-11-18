///<reference path="../../libs/ihjs/types/core.d.ts"/>


const isToggle: (e: Element) => boolean = e => e.dataAttr("toggle") === "1";

export default class  {
    private buttons: HTMLCollection;

    constructor(element: Element){
        element.addClass("toolbar").html(String.html`
            <div class="icon-doc-text" data-name="docs" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">scripts</div>
            </div>
            <div class="icon-database"  data-name="tables" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">tables</div>
            </div>
            <div class="icon-database"  data-name="views" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">views</div>
            </div>
            <div class="icon-database"  data-name="funcs" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">funcs</div>
            </div>
            <div class="icon-search" data-name="search" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">search</div>
            </div>
            <div class="icon-terminal" data-name="terminal" data-toggle="0">
                <div class="marker"></div>
                <div class="lbl">psql</div>
            </div>
        `);

        this.buttons = element.children;
        this.buttons.on("click", (event: Event) => {
            const e = event.target as Element;
            this.buttonClicked(e, e.dataAttr("name"), isToggle(e));
        });
    }

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
}