define(["require", "exports", "./ui/toolbar", "./ui/side-panel", "./ui/main-panel", "./ui/footer"], function (require, exports, toolbar_1, side_panel_1, main_panel_1, footer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(args) {
            args.options.model = null;
        }
        render() {
            return String.html `
        <div>
            <div></div>
            <div></div>
            <div class="main-split-v"></div>
            <div></div>
            <div></div>
        </div>
        `;
        }
        rendered(arg) {
            const child = arg.element.firstElementChild;
            new toolbar_1.default(child.children[0]);
            new side_panel_1.default(child.children[1]);
            new main_panel_1.default(child.children[3]);
            new footer_1.default(child.children[4]);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=index.js.map