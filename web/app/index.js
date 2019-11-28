define(["require", "exports", "app/_sys/storage", "app/ui/toolbar/toolbar", "app/ui/side-panel/side-panel", "app/ui/main-panel/main-panel", "app/ui/footer/footer", "app/controls/splitter"], function (require, exports, storage_1, toolbar_1, side_panel_1, main_panel_1, footer_1, splitter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Positions;
    (function (Positions) {
        Positions["left"] = "left";
        Positions["right"] = "right";
    })(Positions || (Positions = {}));
    ;
    var Themes;
    (function (Themes) {
        Themes["dark"] = "dark";
        Themes["light"] = "light";
    })(Themes || (Themes = {}));
    ;
    const storage = new storage_1.default({ toolbarPos: Positions.left, sidePanelPos: Positions.left, sidePanelWidth: "250", theme: Themes.dark }, "main");
    const getGridTemplateData = () => {
        let tpl = storage.toolbarPos === Positions.left, spl = storage.sidePanelPos === Positions.left, spw = storage.sidePanelWidth;
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
    const themeLink = document.getElementById("theme");
    if (themeLink.attr("href") !== `css/theme-${storage.theme}.css`) {
        themeLink.attr("href", `css/theme-${storage.theme}.css`);
    }
    const element = document.body;
    element.html(String.html `
    <div>
        <div></div><!-- toolbar -->
        <div></div><!-- side panel -->
        <div></div><!-- main splitter vertical -->
        <div></div><!-- main panel -->
        <div></div><!-- footer -->
    </div>
`);
    const container = element.firstElementChild, [areas, columns] = getGridTemplateData();
    container.css("grid-template-areas", `'${areas}' 'footer footer footer footer`);
    container.css("grid-template-columns", columns);
    new toolbar_1.default(container.children[0]);
    new side_panel_1.default(container.children[1]);
    new main_panel_1.default(container.children[3]);
    new footer_1.default(container.children[4]);
    const splitter = new splitter_1.VerticalSplitter({
        name: "v-splitter",
        element: container.children[2],
        container: container,
        resizeIdx: 1,
        autoIdx: 3,
        maxResizeDelta: 100,
        events: {
            docked: () => { },
            undocked: () => { },
            changed: () => { },
        }
    });
    splitter.start();
});
//# sourceMappingURL=index.js.map