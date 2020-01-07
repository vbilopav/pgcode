define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Position;
    (function (Position) {
        Position["LEFT"] = "left";
        Position["RIGHT"] = "right";
    })(Position || (Position = {}));
    exports.Position = Position;
    ;
    var Themes;
    (function (Themes) {
        Themes["DARK"] = "dark";
        Themes["LIGHT"] = "light";
    })(Themes || (Themes = {}));
    exports.Themes = Themes;
    ;
    var AppStatus;
    (function (AppStatus) {
        AppStatus[AppStatus["READY"] = 0] = "READY";
        AppStatus[AppStatus["BUSY"] = 1] = "BUSY";
        AppStatus[AppStatus["ERROR"] = 2] = "ERROR";
        AppStatus[AppStatus["NO_CONNECTION"] = 3] = "NO_CONNECTION";
    })(AppStatus || (AppStatus = {}));
    exports.AppStatus = AppStatus;
    ;
});
//# sourceMappingURL=types.js.map