define(["require", "exports", "app/_sys/storage", "app/ui/toolbar/toolbar", "app/ui/side-panel/side-panel", "app/ui/main-panel/main-panel", "app/ui/footer/footer", "app/controls/splitter", "app/types", "app/_sys/pubsub"], function (require, exports, storage_1, toolbar_1, side_panel_1, main_panel_1, footer_1, splitter_1, types_1, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const storage = new storage_1.default({
        toolbarPosition: types_1.Position.left,
        sidePanelPosition: types_1.Position.left,
        sidePanelWidth: 250,
        sidePanelDocked: true,
        theme: types_1.Themes.dark
    }, "main", (name, value) => name == "sidePanelDocked" ? JSON.parse(value) : value);
    const getGridTemplateData = () => {
        let tpl = storage.toolbarPosition === types_1.Position.left, spl = storage.sidePanelPosition === types_1.Position.left, spw = storage.sidePanelWidth;
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
    const loadingTitle = {
        interval: 225,
        counter: 0,
        frames: ["∙ ∙ ∙ ∙ ∙", "● ∙ ∙ ∙ ∙", "∙ ● ∙ ∙ ∙", "∙ ∙ ● ∙ ∙", "∙ ∙ ∙ ● ∙", "∙ ∙ ∙  ∙ ●"]
    };
    new (class {
        constructor() {
            this.defaultTitle = "pgcode";
            this.initTheme();
            this.initElements();
            this.setStatus(types_1.AppStatus.busy);
            this.initSplitter(this.initGrid());
            this.initComponents();
            this.subscribeEvents();
            document.title = this.defaultTitle;
        }
        moveToolbar(position) {
            if (storage.toolbarPosition === position) {
                return false;
            }
            storage.toolbarPosition = position;
            const resizeIndex = this.initGrid();
            this.splitter.updateIndexesAndAdjust(resizeIndex);
            return true;
        }
        setStatus(status, ...args) {
            if (status == types_1.AppStatus.ready) {
                if (this.status == types_1.AppStatus.ready) {
                    return;
                }
                this.status = status;
                this.overlay.hideElement();
                clearInterval(this.loadingTimeout);
                document.title = this.previousTitle || this.defaultTitle;
            }
            else if (status == types_1.AppStatus.busy) {
                if (this.status == types_1.AppStatus.busy) {
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
            }
            else if (status == types_1.AppStatus.error) {
                if (this.status == types_1.AppStatus.error) {
                    return;
                }
                this.status = status;
                this.overlay.showElement();
                this.previousTitle = document.title;
                clearInterval(this.loadingTimeout);
                document.title = args[0] ? `NETWORK ERROR (${args[0]})` : "NETWORK ERROR";
            }
        }
        initTheme() {
            this.themeLink = document.getElementById("theme");
            if (this.themeLink.attr("href") !== `css/theme-${storage.theme}.css`) {
                this.themeLink.attr("href", `css/theme-${storage.theme}.css`);
            }
        }
        initElements() {
            document.body.html(String.html `
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
        initGrid() {
            const [areas, columns, resizeIndex] = getGridTemplateData();
            this.container.css("grid-template-areas", `'${areas}' 'footer footer footer footer`);
            this.container.css("grid-template-columns", columns);
            return resizeIndex;
        }
        initSplitter(resizeIndex) {
            this.splitter = new splitter_1.VerticalSplitter({
                element: this.container.children[2],
                container: this.container,
                resizeIndex: resizeIndex,
                maxResizeDelta: 100,
                events: {
                    docked: () => pubsub_1.publish(pubsub_1.SIDEBAR_DOCKED),
                    undocked: () => pubsub_1.publish(pubsub_1.SIDEBAR_UNDOCKED),
                    changed: () => { },
                },
                storage: {
                    get position() {
                        return storage.sidePanelWidth;
                    },
                    set position(value) {
                        storage.sidePanelWidth = value;
                    },
                    get docked() {
                        return storage.sidePanelDocked;
                    },
                    set docked(value) {
                        storage.sidePanelDocked = value;
                    }
                }
            }).start();
        }
        initComponents() {
            this.toolbar = new toolbar_1.default(this.container.children[0], storage.toolbarPosition, this);
            this.sidePanel = new side_panel_1.default(this.container.children[1]);
            this.mainPanel = new main_panel_1.default(this.container.children[3]);
            this.footer = new footer_1.default(this.container.children[4]);
        }
        subscribeEvents() {
            pubsub_1.subscribe(pubsub_1.STATE_CHANGED_ON, () => {
                if (this.splitter.isDocked) {
                    this.splitter.undock();
                }
            });
            pubsub_1.subscribe(pubsub_1.STATE_CHANGED_OFF, () => {
                if (!this.splitter.isDocked) {
                    this.splitter.dock();
                }
            });
            pubsub_1.subscribe(pubsub_1.SET_APP_STATUS, (status, ...args) => this.setStatus(status, args));
            document.body.on("contextmenu", e => e.preventDefault());
        }
    })();
});
//# sourceMappingURL=index.js.map