import Storage from "app/_sys/storage";
import Toolbar from "app/ui/toolbar/toolbar";
import SidePanel from "app/ui/side-panel/side-panel";
import MainPanel from "app/ui/main-panel/main-panel";
import Footer from "app/ui/footer/footer";
import {VerticalSplitter, SplitterCtorArgs} from "app/controls/splitter";


enum Positions { left = "left", right = "right" };
enum Themes { dark = "dark", light = "light" };

interface IStorage {
    toolbarPos: Positions, 
    sidePanelPos: string, 
    sidePanelWidth: string, 
    theme: Themes
}

const storage = new Storage(
    {toolbarPos: Positions.left, sidePanelPos: Positions.left, sidePanelWidth: "250", theme: Themes.dark}, 
    "main"
) as any as IStorage;

const getGridTemplateData: () => [string, string] = () => {
    let 
        tpl = storage.toolbarPos === Positions.left, 
        spl = storage.sidePanelPos === Positions.left,
        spw = storage.sidePanelWidth;
    if (tpl && spl) {
        return ["toolbar side-panel main-splitter main-panel", `50px ${spw}px 5px auto`];
    }
    if (tpl && !spl) {
        return ["toolbar main-panel main-splitter side-panel", `50px auto 5px ${spw}px`];
    }
    if (!tpl && spl) {
        return ["side-panel main-splitter main-panel toolbar", `${spw}px 5px auto 50px`];
    }
    if (!tpl && !spl) {
        return ["main-panel main-splitter side-panel toolbar", `auto 5px ${spw}px 50px`];
    }
};

const
    themeLink = document.getElementById("theme");
if (themeLink.attr("href") !== `css/theme-${storage.theme}.css`) {
    themeLink.attr("href", `css/theme-${storage.theme}.css`);
}

const element = document.body;
element.html(String.html`
    <div>
        <div></div><!-- toolbar -->
        <div></div><!-- side panel -->
        <div></div><!-- main splitter vertical -->
        <div></div><!-- main panel -->
        <div></div><!-- footer -->
    </div>
`);

const 
    container = element.firstElementChild,
    [areas, columns] = getGridTemplateData();

container.css("grid-template-areas", `'${areas}' 'footer footer footer footer`);
container.css("grid-template-columns", columns);

new Toolbar(container.children[0]);
new SidePanel(container.children[1]);
new MainPanel(container.children[3]);
new Footer(container.children[4]);

const splitter = new VerticalSplitter({
    name: "v-splitter",
    element: container.children[2],
    container: container,
    resizeIdx: 1,
    autoIdx: 3,
    maxResizeDelta: 100,
    events: {
        docked: () => {}, //_app.pub("sidebar/docked", splitter),
        undocked: () => {}, //_app.pub("sidebar/undocked", splitter),
        changed: () => {}, //_app.pub("sidebar/changed", splitter)
    }
} as SplitterCtorArgs);

splitter.start();

/*
window.on("resize", () => {
    if (splitter.isDocked) {
        return;
    }
    let v = splitter.getValues(),
        w = window.innerWidth,
        delta = w - last;
        last = w;
    if (w - v.prev < 100) {
        splitter.move(delta, v);
    }
});
*/