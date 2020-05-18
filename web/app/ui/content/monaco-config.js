define(["require", "exports", "vs/editor/editor.main"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const deleteExcessActions = editor => {
        delete editor._actions["editor.action.insertCursorAbove"];
        delete editor._actions["editor.action.insertCursorBelow"];
        delete editor._actions["editor.action.addCursorsToBottom"];
        delete editor._actions["editor.action.insertCursorAtEndOfEachLineSelected"];
        delete editor._actions["editor.action.addCursorsToTop"];
        delete editor._actions["editor.action.copyLinesDownAction"];
        delete editor._actions["editor.action.copyLinesUpAction"];
        delete editor._actions["editor.action.clipboardCopyWithSyntaxHighlightingAction"];
        delete editor._actions["cursorRedo"];
        delete editor._actions["cursorUndo"];
        delete editor._actions["deleteAllLeft"];
        delete editor._actions["deleteAllRight"];
        delete editor._actions["editor.action.deleteLines"];
        delete editor._actions["editor.action.forceRetokenize"];
        delete editor._actions["editor.action.inspectTokens"];
        delete editor._actions["editor.action.duplicateSelection"];
        delete editor._actions["editor.action.smartSelect.expand"];
        delete editor._actions["editor.foldAllBlockComments"];
        delete editor._actions["editor.foldAllMarkerRegions"];
        delete editor._actions["editor.foldLevel1"];
        delete editor._actions["editor.foldLevel2"];
        delete editor._actions["editor.foldLevel3"];
        delete editor._actions["editor.foldLevel4"];
        delete editor._actions["editor.foldLevel5"];
        delete editor._actions["editor.foldLevel6"];
        delete editor._actions["editor.foldLevel7"];
        delete editor._actions["editor.unfoldRecursively"];
        delete editor._actions["editor.action.marker.next"];
        delete editor._actions["editor.action.marker.nextInFiles"];
        delete editor._actions["editor.action.marker.prev"];
        delete editor._actions["editor.action.marker.prevInFiles"];
        delete editor._actions["editor.action.indentLines"];
        delete editor._actions["editor.action.insertLineBefore"];
        delete editor._actions["editor.action.insertLineAfter"];
        delete editor._actions["editor.action.joinLines"];
        delete editor._actions["editor.action.moveCarretLeftAction"];
        delete editor._actions["editor.action.moveCarretRightAction"];
        delete editor._actions["editor.action.moveLinesDownAction"];
        delete editor._actions["editor.action.moveLinesUpAction"];
        delete editor._actions["editor.action.openLink"];
        delete editor._actions["editor.action.outdentLines"];
        delete editor._actions["editor.action.showAccessibilityHelp"];
        delete editor._actions["editor.action.showDefinitionPreviewHover"];
        delete editor._actions["editor.action.showHover"];
        delete editor._actions["editor.action.smartSelect.shrink"];
        delete editor._actions["editor.action.sortLinesAscending"];
        delete editor._actions["editor.action.sortLinesDescending"];
        delete editor._actions["editor.action.toggleTabFocusMode"];
        delete editor._actions["editor.action.transpose"];
        delete editor._actions["editor.action.wordHighlight.trigger"];
        delete editor._actions["editor.unfoldAllMarkerRegions"];
        delete editor._actions["editor.unfoldRecursively"];
    };
    exports.createEditor = (element, language) => {
        const editor = monaco.editor.create(element, {
            language,
            theme: "vs-dark",
            renderWhitespace: "all",
            automaticLayout: false
        });
        deleteExcessActions(editor);
        return editor;
    };
});
//# sourceMappingURL=monaco-config.js.map