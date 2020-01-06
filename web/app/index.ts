import Storage from "app/_sys/storage";
import Toolbar from "app/ui/toolbar/toolbar";
import SidePanel from "app/ui/side-panel/side-panel";
import MainPanel from "app/ui/main-panel/main-panel";
import Footer from "app/ui/footer/footer";
import {Splitter, VerticalSplitter, SplitterCtorArgs} from "app/controls/splitter";
import { Position, Themes, AppStatus, IMain } from "app/types";
import { 
    subscribe, publish, SIDEBAR_DOCKED, SIDEBAR_UNDOCKED, STATE_CHANGED_ON, STATE_CHANGED_OFF, SET_APP_STATUS
} from "app/_sys/pubsub";


interface IStorage {
    toolbarPosition: Position, 
    sidePanelPosition: string, 
    sidePanelWidth: number, 
    sidePanelDocked: boolean,
    theme: Themes
}

const 
    storage = new Storage({
        toolbarPosition: Position.left, 
        sidePanelPosition: Position.left, 
        sidePanelWidth: 250, 
        sidePanelDocked: true,
        theme: Themes.dark
    }, 
    "main",
    (name, value) => name == "sidePanelDocked" ? JSON.parse(value) as boolean : value) as any as IStorage;

const 
    getGridTemplateData: () => [string, string, number] = () => {
        let 
            tpl = storage.toolbarPosition === Position.left, 
            spl = storage.sidePanelPosition === Position.left,
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

const 
    loadingTitle = {
        interval: 225, 
        counter: 0, 
        frames: ["∙ ∙ ∙ ∙ ∙", "● ∙ ∙ ∙ ∙", "∙ ● ∙ ∙ ∙", "∙ ∙ ● ∙ ∙", "∙ ∙ ∙ ● ∙", "∙ ∙ ∙  ∙ ●"]
    };

new (class implements IMain {
    private themeLink: Element;
    private container: Element;
    private overlay: Element;
    private toolbar: Toolbar;
    private sidePanel: SidePanel
    private splitter: Splitter;
    private mainPanel: MainPanel;
    private footer: Footer;
    private defaultTitle: string = "pgcode";
    private previousTitle: string;
    private loadingTimeout: number;
    private status: AppStatus;

    constructor() {
        this.initTheme();
        this.initElements();
        this.setStatus(AppStatus.busy);
        this.initSplitter(this.initGrid());
        this.initComponents();
        this.subscribeEvents();
        document.title = this.defaultTitle;
    }

    public moveToolbar(position: Position) : boolean {
        if (storage.toolbarPosition === position) {
            return false;
        }
        storage.toolbarPosition = position;
        const resizeIndex = this.initGrid();
        this.splitter.updateIndexesAndAdjust(resizeIndex);
        return true;
    }

    public setStatus(status: AppStatus, ...args: any[]) : void {
        if (status == AppStatus.ready) {
            if (this.status == AppStatus.ready) {
                return;
            }
            this.status = status;
            this.overlay.hideElement();
            clearInterval(this.loadingTimeout);
            document.title = this.previousTitle || this.defaultTitle;

        } else if (status == AppStatus.busy) {
            if (this.status == AppStatus.busy) {
                return;
            }
            this.status = status;
            this.overlay.showElement();
            this.previousTitle = document.title;
            clearInterval(this.loadingTimeout);
            this.loadingTimeout = setInterval(() => {
                document.title = loadingTitle.frames[loadingTitle.counter];
                loadingTitle.counter++;
                if (loadingTitle.counter == loadingTitle.frames.length) {
                    loadingTitle.counter = 0;
                }
            }, loadingTitle.interval);

        }  else if (status == AppStatus.error) {
            if (this.status == AppStatus.error) {
                return;
            }
            this.status = status;
            this.overlay.showElement();
            this.previousTitle = document.title;
            clearInterval(this.loadingTimeout);
            document.title = args[0] ? `NETWORK ERROR (${args[0]})` : "NETWORK ERROR";

        }
    }

    private initTheme() {
        this.themeLink = document.getElementById("theme");
        if (this.themeLink.attr("href") !== `css/theme-${storage.theme}.css`) {
            this.themeLink.attr("href", `css/theme-${storage.theme}.css`);
        }
    }

    private initElements() {
        document.body.html(String.html`
            <div class="overlay"></div>
            <div class="container">
                <div></div><!-- toolbar -->
                <div></div><!-- side panel -->
                <div></div><!-- main splitter vertical -->
                <div></div><!-- main panel -->
                <div></div><!-- footer -->
            </div>
        `);
        this.overlay = document.body.children[0];
        this.container = document.body.children[1];
    }

    private initGrid() : number {
        const [areas, columns, resizeIndex] = getGridTemplateData();
        this.container.css("grid-template-areas", `'${areas}' 'footer footer footer footer`);
        this.container.css("grid-template-columns", columns);
        return resizeIndex;
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
                changed: () => { /*...*/ },
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

    private initComponents() {
        this.toolbar = new Toolbar(this.container.children[0], storage.toolbarPosition, this);
        this.sidePanel = new SidePanel(this.container.children[1]);
        this.mainPanel = new MainPanel(this.container.children[3]);
        this.footer = new Footer(this.container.children[4]);
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
        subscribe(SET_APP_STATUS, (status: AppStatus, ...args: any[]) => this.setStatus(status, args));
        document.body.on("contextmenu", e => e.preventDefault());
    }
})();

