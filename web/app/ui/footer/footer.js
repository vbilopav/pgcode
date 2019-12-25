define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class default_1 {
        constructor(element) {
            element.addClass("footer").html(String.html `
            <div class="conns">
                <span class="icon-database"></span>
                Connection not selected
            </div>
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=footer.js.map