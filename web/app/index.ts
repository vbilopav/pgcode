import Storage from "app/_sys/storage";
import Toolbar from "app/ui/toolbar/toolbar";
import SidePanel from "app/ui/side-panel/side-panel";
import MainPanel from "app/ui/main-panel/main-panel";
import Footer from "app/ui/footer/footer";
import {Splitter, VerticalSplitter, SplitterCtorArgs} from "app/controls/splitter";
import { Positions, Themes, IMain } from "app/types";
import { 
    subscribe, publish, SIDEBAR_DOCKED, SIDEBAR_UNDOCKED, STATE_CHANGED_ON, STATE_CHANGED_OFF
} from "app/_sys/pubsub";


interface IStorage {
    toolbarPosition: Positions, 
    sidePanelPosition: string, 
    sidePanelWidth: number, 
    sidePanelDocked: boolean,
    theme: Themes
}

const 
    storage = new Storage({
        toolbarPosition: Positions.left, 
        sidePanelPosition: Positions.left, 
        sidePanelWidth: 250, 
        sidePanelDocked: true,
        theme: Themes.dark
    }, 
    "main",
    (name, value) => name == "sidePanelDocked" ? JSON.parse(value) as boolean : value) as any as IStorage;

const 
    getGridTemplateData: () => [string, string, number] = () => {
        let 
            tpl = storage.toolbarPosition === Positions.left, 
            spl = storage.sidePanelPosition === Positions.left,
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

new (class implements IMain {
    private themeLink: Element;
    private container: Element;
    private toolbar: Toolbar;
    private sidePanel: SidePanel
    private splitter: Splitter;
    private mainPanel: MainPanel;
    private footer: Footer;

    constructor() {
        this.initTheme();
        this.initContainer();
        const resizeIndex = this.initGrid();

        this.toolbar = new Toolbar(this.container.children[0], storage.toolbarPosition, this);
        this.sidePanel = new SidePanel(this.container.children[1]);
        this.mainPanel = new MainPanel(this.container.children[3]);
        this.footer = new Footer(this.container.children[4]);

        this.initSplitter(resizeIndex);
        this.subscribeEvents();
    }

    public moveToolbar(position: Positions) : boolean {
        if (storage.toolbarPosition === position) {
            return false;
        }
        storage.toolbarPosition = position;
        const resizeIndex = this.initGrid();
        this.splitter.updateIndexesAndAdjust(resizeIndex);
        return true;
    }

    private subscribeEvents() {
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

    private initContainer() {
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
    }

    private initGrid() : number {
        const [areas, columns, resizeIndex] = getGridTemplateData();
        this.container.css("grid-template-areas", `'${areas}' 'footer footer footer footer`);
        this.container.css("grid-template-columns", columns);
        return resizeIndex;
    }

    private initTheme() {
        this.themeLink = document.getElementById("theme");
        if (this.themeLink.attr("href") !== `css/theme-${storage.theme}.css`) {
            this.themeLink.attr("href", `css/theme-${storage.theme}.css`);
        }
    }

    private initSplitter(resizeIndex: number) {
        this.splitter = new VerticalSplitter({
            element: this.container.children[2],
            container: this.container,
            resizeIndex: resizeIndex,
            maxResizeDelta: 100,
            events: {
                docked: () => publish(SIDEBAR_DOCKED),
                undocked: () => publish(SIDEBAR_UNDOCKED),
                changed: () => {}, //_app.pub("sidebar/changed", splitter)
            },
            storage: {
                get position() {
                    return storage.sidePanelWidth
                },
                set position(value: number) {
                    storage.sidePanelWidth = value;
                },
                get docked() {
                    return storage.sidePanelDocked
                },
                set docked(value: boolean) {
                    storage.sidePanelDocked = value;
                }
            } as any
        } as SplitterCtorArgs).start() as VerticalSplitter;
    }
})();

