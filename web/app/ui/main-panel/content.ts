import {Editor, IEditor, nullEditor} from "app/ui/main-panel/editor";
import {HorizontalSplitter, SplitterCtorArgs} from "app/controls/splitter";
import {classes, IScriptContent, ItemInfoType, Keys, Languages, fetchScriptContent, ItemContentArgs} from "app/api";
import Storage from "app/_sys/storage";

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
    private stickyId: string;

    constructor(element: Element) {
        this.container = element;
    }

    public disposeEditor(id: string) {
        const e = this.getContentElement(id);
        if (!e.length) {
            return
        }
        this.editor(e).dispose();
    }

    public async createOrActivateContent(id: string, key: Keys, data: ItemInfoType, contentArgs = {content: null, sticky: false}) {
        if (contentArgs.sticky) {
            if (this.stickyId && id != this.stickyId) {
                const e = this.getContentElement(this.stickyId);
                if (e.length) {
                    this.editor(e).dispose();
                    e.remove();
                }
            }
            this.stickyId = id;
        }
        await this.createNewContent(id, key, data, contentArgs);
        this.activate(id);
    }

    public async createNewContent(id: string, key: Keys, data: ItemInfoType, contentArgs = {content: null, sticky: false}) {
        if (contentArgs.sticky) {
            this.stickyId = id;
        }
        const newElement = this.createElement(id, key, contentArgs.content)
            .hideElement()
            .attr("id", id)
            .dataAttr("key", key)
            .dataAttr("data", data)
            .addClass("content")
            .appendElementTo(this.container);
        if (!contentArgs.content && key === Keys.SCRIPTS) {
            const response = await fetchScriptContent(data.connection, data.id);
            if (response.ok) {
                this.editor(newElement).setContent(response.data);
            }
        }
    }


    public setStickStatus(id: string, value: boolean) {
        if (value) {
            this.stickyId = id;
        } else {
            this.stickyId = undefined;
        }
    }

    public activate(id: string) {
        const e = this.getContentElement(id);
        if (!e.length) {
            return false;
        }
        if (this.active) {
            this.active.hideElement().removeClass(classes.active);
        }
        this.active = e.showElement().addClass(classes.active);
        setTimeout(() => this.editor(e).layout().focus());
        return true;
    }

    public remove(id: string) {
        const e = this.container.find("#" + id);
        if (!e.length) {
            return
        }
        this.editor(e).dispose();
        e.remove();
    }
    
    public createElement(id: string, key: Keys, content: IScriptContent = null) {
        if (key == Keys.SCRIPTS) {
            return this.createSplitEditor(id, Languages.PGSQL, content);
        }
        return (String.html`
            <div>
                ${key.toString()}:  ${id}
            </div>` as string)
                .toElement()
    }

    private createSplitEditor(id: string, lang: Languages, content: IScriptContent = null) {
        const element = (String.html`
            <div>
                <div class="editor"></div>
                <div></div>
                <div class="grid"></div>
            </div>` as string)
            .toElement()
            .addClass("split-content")
            .css("grid-template-rows", `auto 5px ${_getSplitterVal(id).height}px`);
        const editor = new Editor(id, element.children[0], element, lang);
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

    private getContentElement(id: string) {
        return this.container.find("#" + id);
    }
}
