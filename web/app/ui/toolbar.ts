///<reference path="../../libs/ihjs/types/core.d.ts"/>
///<reference path="../../libs/ihjs/types/pubsub.d.ts"/>

import {publish, subscribe} from 'ihjs/pubsub';

const isToggle: (e: Element) => boolean = e => e.dataAttr("toggle") === "1";

export default class  {
    private buttons: HTMLCollection;

    constructor(element: Element){
        element.addClass("toolbar").html(String.html`
            <div class="select-schema" data-name="schema">
                public
            </div>
            <div class="icon-doc-text btn-docs" data-name="docs" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">scripts</div>
            </div>
            <div class="icon-database btn-tables"  data-name="tables" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">tables</div>
            </div>
            <div class="icon-database btn-views"  data-name="views" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">views</div>
            </div>
            <div class="icon-database btn-funcs" data-name="funcs" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">funcs</div>
            </div>
            <div class="icon-search btn-search" data-name="search" data-toggle="1">
                <div class="marker"></div>
                <div class="lbl">search</div>
            </div>
            <div class="icon-terminal btn-psql" data-name="terminal" data-toggle="0">
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