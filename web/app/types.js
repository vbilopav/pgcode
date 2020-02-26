define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Position;
    (function (Position) {
        Position["LEFT"] = "left";
        Position["RIGHT"] = "right";
    })(Position = exports.Position || (exports.Position = {}));
    ;
    var Themes;
    (function (Themes) {
        Themes["DARK"] = "dark";
        Themes["LIGHT"] = "light";
    })(Themes = exports.Themes || (exports.Themes = {}));
    ;
    var AppStatus;
    (function (AppStatus) {
        AppStatus[AppStatus["READY"] = 0] = "READY";
        AppStatus[AppStatus["BUSY"] = 1] = "BUSY";
        AppStatus[AppStatus["ERROR"] = 2] = "ERROR";
        AppStatus[AppStatus["NO_CONNECTION"] = 3] = "NO_CONNECTION";
    })(AppStatus = exports.AppStatus || (exports.AppStatus = {}));
    ;
    exports.keys = {
        scripts: "scripts",
        tables: "tables",
        views: "views",
        routines: "routines",
        search: "search"
    };
    var EditorType;
    (function (EditorType) {
        EditorType[EditorType["SCRIPT"] = 0] = "SCRIPT";
    })(EditorType = exports.EditorType || (exports.EditorType = {}));
    ;
});
//# sourceMappingURL=types.js.map