define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.routineTitle = (item) => {
        let title = `Routine id ${item.id}\n`;
        title += `${item.name}\n`;
        title += `returns ${item.returns}\n`;
        title += `${item.language} ${item.type}`;
        if (item.comment) {
            title = title + `\n\n${item.comment.substring(0, 200)}`;
        }
        return title;
    };
    exports.scriptTitle = (item) => {
        let title = `Script id ${item.id}\n`;
        title += `${item.name}\n`;
        title += `modified: ${item.timestamp}`;
        if (item.comment) {
            title = title + `\n\n${item.comment.substring(0, 200)}`;
        }
        return title;
    };
    exports.tableTitle = (item) => {
        let title = `Table id ${item.id}\n`;
        title += `${item.name}\n`;
        title += `estimated row count: ${item.estimate}`;
        if (item.comment) {
            title = title + `\n\n${item.comment.substring(0, 200)}`;
        }
        return title;
    };
    exports.viewTitle = (item) => {
        let title = `View id ${item.id}\n`;
        title += `${item.name}\n`;
        title += `estimated row count: ${item.estimate}`;
        if (item.comment) {
            title = title + `\n\n${item.comment.substring(0, 200)}`;
        }
        return title;
    };
});
//# sourceMappingURL=item-tooltip.js.map