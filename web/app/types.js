define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Position;
    (function (Position) {
        Position["left"] = "left";
        Position["right"] = "right";
    })(Position || (Position = {}));
    exports.Position = Position;
    ;
    var Themes;
    (function (Themes) {
        Themes["dark"] = "dark";
        Themes["light"] = "light";
    })(Themes || (Themes = {}));
    exports.Themes = Themes;
    ;
    var AppStatus;
    (function (AppStatus) {
        AppStatus[AppStatus["ready"] = 0] = "ready";
        AppStatus[AppStatus["busy"] = 1] = "busy";
        AppStatus[AppStatus["error"] = 2] = "error";
    })(AppStatus || (AppStatus = {}));
    exports.AppStatus = AppStatus;
    ;
});
//# sourceMappingURL=types.js.map