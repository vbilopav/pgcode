import Storage from "app/_sys/storage";
import Toolbar from "app/ui/toolbar/toolbar";
import SidePanel from "./ui/side-panel/_side-panels";
import MainPanel from "app/ui/main-panel/main-panel";
import Footer from "app/ui/footer/footer";
import {Splitter, VerticalSplitter, SplitterCtorArgs} from "app/controls/splitter";
import { Position, Themes, AppStatus, IMain, fetchInitial } from "app/api";
import "app/extensions";
import { 
    subscribe, publish, 
    SIDEBAR_DOCKED, 
    SIDEBAR_UNDOCKED, 
    STATE_CHANGED_ON, 
    STATE_CHANGED_OFF, 
    SET_APP_STATUS, 
    API_INITIAL,
    SPLITTER_CHANGED
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
        toolbarPosition: Position.LEFT, 
        sidePanelPosition: Position.LEFT, 
        sidePanelWidth: 250, 
        sidePanelDocked: true,
        theme: Themes.DARK
    }, 
    "main",
    (name, value) => name == "sidePanelDocked" ? JSON.parse(value) as boolean : value) as any as IStorage;

const 
    getGridTemplateData: () => [string, string, number] = () => {
        let 
            tpl = storage.toolbarPosition === Position.LEFT, 
            spl = storage.sidePanelPosition === Position.LEFT,
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
    private splitter: Splitter;
    private defaultTitle: string = "pgcode";
    private previousTitle: string;
    private loadingTimeout: number;
    private status: AppStatus;

    constructor() {
        this.initTheme();
        this.initElements();
        this.setStatus(AppStatus.BUSY, []);
        
        this.initComponents();
        this.initSplitter(this.initGrid());

        this.subscribeEvents();
        this.initializeApi();
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

    public setStatus(status: AppStatus, args: any[]) : void {
        if (status == AppStatus.READY) {
            if (this.status == AppStatus.READY) {
                return;
            }
            this.status = status;
            this.overlay.hideElement().css("opacity", "0");
            clearInterval(this.loadingTimeout);
            document.title = args.length ? `${args[0]} - ${this.defaultTitle}` : this.previousTitle;

        } else if (status == AppStatus.BUSY) {
            if (this.status == AppStatus.BUSY) {
                return;
            }
            this.status = status;
            this.overlay.showElement();
            setTimeout(() => this.overlay.css("opacity", "0.4"));
            this.previousTitle = document.title;
            clearInterval(this.loadingTimeout);
            this.loadingTimeout = setInterval(() => {
                document.title = loadingTitle.frames[loadingTitle.counter];
                loadingTitle.counter++;
                if (loadingTitle.counter == loadingTitle.frames.length) {
                    loadingTitle.counter = 0;
                }
            }, loadingTitle.interval);

        }  else if (status == AppStatus.ERROR) {
            if (this.status == AppStatus.ERROR) {
                return;
            }
            this.status = status;
            this.overlay.showElement();
            setTimeout(() => this.overlay.css("opacity", "0.4"));
            this.previousTitle = document.title;
            clearInterval(this.loadingTimeout);
            document.title = args.length ? `NETWORK ERROR (${args[0]})` : "NETWORK ERROR";

        }  else if (status == AppStatus.NO_CONNECTION) {
            if (this.status == AppStatus.NO_CONNECTION) {
                return;
            }
            this.status = status;
            this.overlay.hideElement().css("opacity", "0");
            clearInterval(this.loadingTimeout);
            this.previousTitle = document.title;
            document.title = `NO CONNECTION - ${this.defaultTitle}`;
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
            events: {
                docked: () => publish([SIDEBAR_DOCKED, SPLITTER_CHANGED]),
                undocked: () => publish([SIDEBAR_UNDOCKED, SPLITTER_CHANGED]),
                changed: () => publish(SPLITTER_CHANGED)
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
            }
        } as SplitterCtorArgs).start() as VerticalSplitter;
    }

    private initComponents() {
        const mainPanel = new MainPanel(this.container.children[3]);
        new Toolbar(this.container.children[0], storage.toolbarPosition, this);
        new SidePanel(this.container.children[1], mainPanel);
        new Footer(this.container.children[4]);
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

    private async initializeApi() {
        const initial = await fetchInitial();
        publish(API_INITIAL, initial);
    }

})();

