import Storage from "app/_sys/storage";
import Toolbar from "./ui/toolbar/toolbar";
import SidePanel from "./ui/side-panel/side-panel";
import MainPanel from "./ui/main-panel/main-panel";
import Footer from "./ui/footer/footer";

Storage.setDefaultNamespace("pgcode");

enum Positions { left = "left", right = "right" };
enum Themes { dark = "dark", light = "light" };

interface IStorage {
    toolbarPos: Positions, 
    sidePanelPos: string, 
    sidePanelWidth: string, 
    theme: Themes
}

const 
    storage = new Storage({ 
        toolbarPos: Positions.left,
        sidePanelPos: Positions.left,
        sidePanelWidth: "250",
        theme: Themes.dark
    }, "main") as any as IStorage;

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

const element = document.body;
element.html(String.html`
    <div>
        <div></div>
        <div></div>
        <div class="main-split-v"></div>
        <div></div>
        <div></div>
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
