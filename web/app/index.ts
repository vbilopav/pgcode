///<reference path="../libs/ihjs/types/core.d.ts"/>

import Storage from "./_sys/storage";
import Toolbar from "./ui/toolbar";
import SidePanel from "./ui/side-panel";
import MainPanel from "./ui/main-panel";
import Footer from "./ui/footer";

Storage.setDefaultNamespace("pgcode");

enum Positions { left = "left", right = "right" };
enum Themes { dark = "dark", light = "light" };

const 
    storage = new Storage({ 
        toolbarPos: Positions.left,
        sidePanelPos: Positions.left,
        sidePanelWidth: "250",
        theme: Themes.dark
    }, "main") as any as {
        toolbarPos: string, 
        sidePanelPos: string, 
        sidePanelWidth: string, 
        theme: string
    };

const 
    getGridTemplateData: () => [string, string] = () => {
        let 
            tpl = storage.toolbarPos === Positions.left, 
            spl = storage.sidePanelPos === Positions.left,
            spw = storage.sidePanelWidth;
        if (tpl && spl) {
            return ["toolbar side-panel main-splitter main-panel", `50px ${spw}px 3px auto`];
        }
        if (tpl && !spl) {
            return ["toolbar main-panel main-splitter side-panel", `50px auto 3px ${spw}px`];
        }
        if (!tpl && spl) {
            return ["side-panel main-splitter main-panel toolbar", `${spw}px 3px auto 50px`];
        }
        if (!tpl && !spl) {
            return ["main-panel main-splitter side-panel toolbar", `auto 3px ${spw}px 50px`];
        }
    };

const
    themeLink = document.getElementById("theme");
if (themeLink.attr("href") !== `css/theme-${storage.theme}.css`) {
    themeLink.attr("href", `css/theme-${storage.theme}.css`);
}

export default class implements IView {
    private container: Element;
    
    constructor(args: ViewConstructorArgs) {
        args.options.model = null;
    }

    render() {
        return String.html`
        <div>
            <div></div>
            <div></div>
            <div class="main-split-v"></div>
            <div></div>
            <div></div>
        </div>
        `;
    }

    rendered(arg: ViewMethodArgs) {
        const 
            child = arg.element.firstElementChild,
            [areas, columns] = getGridTemplateData();
        this.container = child as Element;
        this.container.css("grid-template-areas", `'${areas}' 'footer footer footer footer`);
        this.container.css("grid-template-columns", columns);

        new Toolbar(child.children[0]);
        new SidePanel(child.children[1]);
        new MainPanel(child.children[3]);
        new Footer(child.children[4]);
    }
}
