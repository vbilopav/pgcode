define(["require", "exports", "app/_sys/storage", "./ui/toolbar/toolbar", "./ui/side-panel/side-panel", "./ui/main-panel/main-panel", "./ui/footer/footer"], function (require, exports, storage_1, toolbar_1, side_panel_1, main_panel_1, footer_1) {
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
    const themeLink = document.getElementById("theme");
    if (themeLink.attr("href") !== `css/theme-${storage.theme}.css`) {
        themeLink.attr("href", `css/theme-${storage.theme}.css`);
    }
    const element = document.body;
    element.html(String.html `
    <div>
        <div></div>
        <div></div>
        <div class="main-split-v"></div>
        <div></div>
        <div></div>
    </div>
`);
    const container = element.firstElementChild, [areas, columns] = getGridTemplateData();
    container.css("grid-template-areas", `'${areas}' 'footer footer footer footer`);
    container.css("grid-template-columns", columns);
    new toolbar_1.default(container.children[0]);
    new side_panel_1.default(container.children[1]);
    new main_panel_1.default(container.children[3]);
    new footer_1.default(container.children[4]);
});
//# sourceMappingURL=index.js.map