define(["require", "exports", "app/_sys/storage", "app/ui/toolbar/toolbar", "app/ui/side-panel/side-panel", "app/ui/main-panel/main-panel", "app/ui/footer/footer", "app/controls/splitter", "app/types", "app/_sys/pubsub"], function (require, exports, storage_1, toolbar_1, side_panel_1, main_panel_1, footer_1, splitter_1, types_1, pubsub_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const storage = new storage_1.default({
        toolbarPosition: types_1.Positions.left,
        sidePanelPosition: types_1.Positions.left,
        sidePanelWidth: 250,
        sidePanelDocked: true,
        theme: types_1.Themes.dark
    }, "main", (name, value) => name == "sidePanelDocked" ? JSON.parse(value) : value);
    const getGridTemplateData = () => {
        let tpl = storage.toolbarPosition === types_1.Positions.left, spl = storage.sidePanelPosition === types_1.Positions.left, spw = storage.sidePanelWidth;
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
        constructor() {
            this.initTheme();
            this.initElements();
            this.initSplitter(this.initGrid());
            this.initComponents();
            this.subscribeEvents();
            document.title = "pgcode";
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
            this.overlay = document.body.find("div.overlay");
            this.container = document.body.find("div.container");
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
            document.body.on("contextmenu", e => e.preventDefault());
        }
    })();
});
//# sourceMappingURL=index.js.map