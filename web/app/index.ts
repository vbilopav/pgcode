///<reference path="../libs/ihjs/types/core.d.ts"/>

import Toolbar from "./ui/toolbar";
import SidePanel from "./ui/side-panel";
import MainSplitter from "./ui/main-splitter";
import MainPanel from "./ui/main-panel";
import Footer from "./ui/footer";

export default class implements IView {
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
        const child = arg.element.firstElementChild

        new Toolbar(child.children[0] as HTMLElement);
        new SidePanel(child.children[1] as HTMLElement);
        new MainPanel(child.children[3] as HTMLElement);
        new Footer(child.children[4] as HTMLElement);
/*
        let css = document.createElement("LINK") as HTMLLinkElement;
        (css as any).async = true;
        css.href = "css/theme-dark.css";
        css.rel = "stylesheet";
        document.head.appendChild(css);
*/
    }
}
