import {Editor, IEditor, nullEditor} from "app/ui/main-panel/editor";
import {HorizontalSplitter, SplitterCtorArgs} from "app/controls/splitter";
import {classes, IScriptContent, ItemInfoType, Keys, Languages} from "app/api";
import Storage from "app/_sys/storage";

//import {publish, SIDEBAR_DOCKED, SIDEBAR_UNDOCKED, SPLITTER_CHANGED} from "../../_sys/pubsub";

interface IStorageSplitterItem { height?: number, docked?: boolean }
interface IStorage {
    splitter: {[id: string]: IStorageSplitterItem }
}
const 
    _defaultSplitValue: IStorageSplitterItem = {height: 50, docked: true};
const
    _storage = new Storage(
        {splitter: {}}, 
        "content",
        (name, value) =>  JSON.parse(value) as IStorage,
            (name, value) =>  JSON.stringify(value)
    ) as any as IStorage,
    _getSplitterVal: (id: string) => IStorageSplitterItem = id => {
        const s = _storage.splitter, v = s[id];
        if (!v) {
            return _defaultSplitValue;
        }
        return v;
    },
    _setSplitterVal: (id: string, item: IStorageSplitterItem) => void = (id, item) => {
        const s = _storage.splitter, v = s[id];
        s[id] = {...(v ? v : _defaultSplitValue), ...item};
        _storage.splitter = s;
    };

export default class  {
    private readonly container: Element;
    private active: Element;

    constructor(element: Element){
        this.container = element;
    }

    public createNew(id: string, key: Keys, data: ItemInfoType, content: IScriptContent = null) {
        if (this.active) {
            this.active.hideElement();
        }
        this.active = this.createElement(id, key)
            .hideElement()
            .attr("id", id)
            .dataAttr("key", key)
            .dataAttr("data", data)
            .addClass("content")
            .appendElementTo(this.container);
        
        // load item
        if (key === Keys.ROUTINES) {
            console.log(`get the content for routine with id ${data.id}`);
        } else if (key === Keys.SCRIPTS) {
            console.log(`get the content for script with id ${data.id}`);
        } else if (key === Keys.TABLES) {
            console.log(`get the content for table with id ${data.id}`);
        } else if (key === Keys.VIEWS) {
            console.log(`get the content for view with id ${data.id}`);
        }
        
        if (content !== null) {
            console.log("I haz a content", content);
        }
    }

    public activate(id: string) {
        const e = this.container.find("#" + id);
        if (!e.length) {
            return
        }
        if (this.active) {
            this.active.hideElement().removeClass(classes.active);
        }
        this.active = e.showElement().addClass(classes.active);
        setTimeout(() => this.editor(e).layout().focus(), 0);
    }

    public remove(id: string) {
        const e = this.container.find("#" + id);
        if (!e.length) {
            return
        }
        this.editor(e).dispose();
        e.remove();
    }
    
    public createElement(id: string, key: Keys) {
        if (key == Keys.SCRIPTS) {
            return this.createSplit(id, Languages.PGSQL);
        }
        return (String.html`
            <div>
                ${key.toString()}:  ${id}
            </div>` as string)
                .toElement()
    }

    private createSplit(id: string, lang: Languages) {
        const element = (String.html`
            <div>
                <div class="editor"></div>
                <div></div>
                <div class="grid"></div>
            </div>` as string)
            .toElement()
            .addClass("split-content")
            .css("grid-template-rows", `auto 5px ${_getSplitterVal(id).height}px`);
        const editor = new Editor(element.children[0], element, lang);
        element.dataAttr("editor", editor);
        
        new HorizontalSplitter({
            element: element.children[1],
            container: element,
            resizeIndex: 2,
            maxDelta: 100,
            min: 25,
            events: {
                docked: () => {editor.layout()},
                undocked: () => {editor.layout()},
                changed: () => {editor.layout()}
            },
            storage: {
                get position() {
                    return _getSplitterVal(id).height
                },
                set position(value: number) {
                    _setSplitterVal(id, {height: value});
                },
                get docked() {
                    return _getSplitterVal(id).docked;
                },
                set docked(value: boolean) {
                    _setSplitterVal(id, {docked: value});
                }
            }
        } as SplitterCtorArgs).start();

        return element;
    }

    private editor(e: Element): IEditor {
        const editor = e.dataAttr("editor") as IEditor;
        if (editor) {
            return editor;
        }
        return nullEditor;
    }
}
