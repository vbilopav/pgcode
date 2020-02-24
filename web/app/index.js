define(["require", "exports", "app/_sys/storage", "app/ui/toolbar/toolbar", "./ui/side-panel/_side-panels", "app/ui/main-panel/main-panel", "app/ui/footer/footer", "app/controls/splitter", "app/types", "app/api", "app/_sys/pubsub"], function (require, exports, storage_1, toolbar_1, _side_panels_1, main_panel_1, footer_1, splitter_1, types_1, api_1, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    String.prototype.formatDateString = function () {
        const d = new Date(this);
        const today = new Date();
        const fullYear = d.getFullYear();
        const date = d.getDate();
        const month = d.getMonth();
        if (date == today.getDate() && month == today.getMonth() && fullYear == today.getFullYear()) {
            return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}.${d.getMilliseconds().toString().padStart(3, "0")}`;
        }
        else {
            return `${fullYear}-${(month + 1).toString().padStart(2, "0")}-${date.toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}.${d.getMilliseconds().toString().padStart(3, "0")}`;
        }
    };
    const storage = new storage_1.default({
        toolbarPosition: types_1.Position.LEFT,
        sidePanelPosition: types_1.Position.LEFT,
        sidePanelWidth: 250,
        sidePanelDocked: true,
        theme: types_1.Themes.DARK
    }, "main", (name, value) => name == "sidePanelDocked" ? JSON.parse(value) : value);
    const getGridTemplateData = () => {
        let tpl = storage.toolbarPosition === types_1.Position.LEFT, spl = storage.sidePanelPosition === types_1.Position.LEFT, spw = storage.sidePanelWidth;
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
            this.setStatus(types_1.AppStatus.BUSY, []);
            this.initComponents();
            this.initSplitter(this.initGrid());
            this.subscribeEvents();
            this.initializeApi();
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
        setStatus(status, args) {
            if (status == types_1.AppStatus.READY) {
                if (this.status == types_1.AppStatus.READY) {
                    return;
                }
                this.status = status;
                this.overlay.hideElement().css("opacity", "0");
                clearInterval(this.loadingTimeout);
                document.title = args.length ? `${args[0]} - ${this.defaultTitle}` : this.previousTitle;
            }
            else if (status == types_1.AppStatus.BUSY) {
                if (this.status == types_1.AppStatus.BUSY) {
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
            }
            else if (status == types_1.AppStatus.ERROR) {
                if (this.status == types_1.AppStatus.ERROR) {
                    return;
                }
                this.status = status;
                this.overlay.showElement();
                setTimeout(() => this.overlay.css("opacity", "0.4"));
                this.previousTitle = document.title;
                clearInterval(this.loadingTimeout);
                document.title = args.length ? `NETWORK ERROR (${args[0]})` : "NETWORK ERROR";
            }
            else if (status == types_1.AppStatus.NO_CONNECTION) {
                if (this.status == types_1.AppStatus.NO_CONNECTION) {
                    return;
                }
                this.status = status;
                this.overlay.hideElement().css("opacity", "0");
                clearInterval(this.loadingTimeout);
                this.previousTitle = document.title;
                document.title = `NO CONNECTION - ${this.defaultTitle}`;
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
            this.sidePanel = new _side_panels_1.default(this.container.children[1]);
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
        async initializeApi() {
            const initial = await api_1.fetchInitial();
            pubsub_1.publish(pubsub_1.API_INITIAL, initial);
        }
    })();
});
//# sourceMappingURL=index.js.map