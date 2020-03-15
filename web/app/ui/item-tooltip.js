define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const getTitle = (title, sub, item) => `${title}\n` +
        `connection: ${item.connection}\n` +
        `schema: ${item.schema}` +
        (sub ? "\n" + sub : "") +
        (item.comment ? `\n\n${item.comment}` : "");
    exports.routineTitle = (item) => getTitle(`${item.language.toLowerCase()} ${item.type.toLowerCase()} ${item.name} returns ${item.returns}`, null, item);
    exports.scriptTitle = (item) => getTitle(`script: ${item.name}`, `modified: ${item.timestamp.formatDateString()}`, item);
    exports.tableTitle = (item) => getTitle(`table: ${item.name}`, `estimated count ≈ ${item.estimate}`, item);
    exports.viewTitle = (item) => getTitle(`view: ${item.name}`, `estimated count ≈ ${item.estimate}`, item);
});
//# sourceMappingURL=item-tooltip.js.map