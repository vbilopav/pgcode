import "vs/editor/editor.main";
import ICodeEditor = monaco.editor.ICodeEditor;

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


export const commandIds = {
    selectAll: "pgcode.selectAll",
    execute: "pgcode.execute"
}

export const createEditor = (element: Element, language: string, execute: (editor: ICodeEditor, ...args: any[]) => void | Promise<void>) => {
    
    let editor = monaco.editor.create(element as HTMLElement, {
        language,
        theme: "vs-dark",
        renderWhitespace: "all",
        automaticLayout: false,
        selectOnLineNumbers: true,
        glyphMargin: true,
        smoothScrolling: true,
        //contextmenu: false //todo: disable default contextmenu and implement a better one
    });
    deleteExcessActions(editor);

    editor.addAction({
        id: commandIds.execute,
        label: "Execute",
        keybindings: [
            monaco.KeyCode.F5
        ],
        precondition: null,
        keybindingContext: null,
        contextMenuGroupId: "execution",
        contextMenuOrder: 1.5,

        run: execute
    });

    editor.addAction({
        id: commandIds.selectAll,
        label: "Select All",
        keybindings: [
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_A,
        ],
        precondition: null,
        keybindingContext: null,
        contextMenuGroupId: "9_cutcopypaste",
        contextMenuOrder: 2,
        run: (editor: ICodeEditor) => {
            editor.trigger("pgcode-editor", "selectAll", null);
        }
    });

    return editor;
}

