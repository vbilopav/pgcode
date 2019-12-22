import Storage from "app/_sys/storage";
import Toolbar from "app/ui/toolbar/toolbar";
import SidePanel from "app/ui/side-panel/side-panel";
import MainPanel from "app/ui/main-panel/main-panel";
import Footer from "app/ui/footer/footer";
import {VerticalSplitter, SplitterCtorArgs} from "app/controls/splitter";
import { Positions, Themes } from "app/enums";
import { 
    subscribe, publish, SIDEBAR_DOCKED, SIDEBAR_UNDOCKED, STATE_CHANGED_ON, STATE_CHANGED_OFF
} from "app/_sys/pubsub";


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
    getGridTemplateData: () => [string, string, number] = () => {
        let 
            tpl = storage.toolbarPos === Positions.left, 
            spl = storage.sidePanelPos === Positions.left,
            spw = storage.sidePanelWidth;
        if (tpl && spl) {
            return ["toolbar side-panel main-splitter main-panel", `50px ${spw}px 5px auto`, 1];
        }
        if (tpl && !spl) {
            return ["toolbar main-panel main-splitter side-panel", `50px auto 5px ${spw}px`, 3];
        }
        if (!tpl && spl) {
            return ["side-panel main-splitter main-panel toolbar", `${spw}px 5px auto 50px`, 0];
        }
        if (!tpl && !spl) {
            return ["main-panel main-splitter side-panel toolbar", `auto 5px ${spw}px 50px`, 2];
        }
    };

new (class {
    private themeLink: Element;
    private container: Element;
    private toolbar: Toolbar;
    private sidePanel: SidePanel
    private splitter: VerticalSplitter;
    private mainPanel: MainPanel;
    private footer: Footer;

    constructor() {
        
        this.themeLink = document.getElementById("theme");
        if (this.themeLink.attr("href") !== `css/theme-${storage.theme}.css`) {
            this.themeLink.attr("href", `css/theme-${storage.theme}.css`);
        }

        document.body.html(String.html`
            <div>
                <div></div><!-- toolbar -->
                <div></div><!-- side panel -->
                <div></div><!-- main splitter vertical -->
                <div></div><!-- main panel -->
                <div></div><!-- footer -->
            </div>
        `);
        this.container = document.body.firstElementChild;

        const [areas, columns, resizeIndex] = getGridTemplateData();
        this.container.css("grid-template-areas", `'${areas}' 'footer footer footer footer`);
        this.container.css("grid-template-columns", columns);

        this.toolbar = new Toolbar(this.container.children[0], storage.toolbarPos);
        this.sidePanel = new SidePanel(this.container.children[1]);
        this.mainPanel = new MainPanel(this.container.children[3]);
        this.footer = new Footer(this.container.children[4]);

        this.splitter = new VerticalSplitter({
            name: "v-splitter",
            element: this.container.children[2],
            container: this.container,
            resizeIndex: resizeIndex,
            maxResizeDelta: 100,
            events: {
                docked: () => publish(SIDEBAR_DOCKED),
                undocked: () => publish(SIDEBAR_UNDOCKED),
                changed: () => {}, //_app.pub("sidebar/changed", splitter)
            }
        } as SplitterCtorArgs).start() as VerticalSplitter;

        subscribe(STATE_CHANGED_ON, () => {
            if (this.splitter.isDocked) {
                this.splitter.undock();
            }
        });
        subscribe(STATE_CHANGED_OFF, () => {
            if (!this.splitter.isDocked) {
                this.splitter.dock();
            }
        });

        document.body.on("contextmenu", e => e.preventDefault());
    }
})();

