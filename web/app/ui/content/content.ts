import {Editor, IEditor, nullEditor} from "app/ui/content/editor";
import {HorizontalSplitter, SplitterCtorArgs} from "app/controls/splitter";
import {classes, IScriptContent, ItemInfoType, Keys, Languages, fetchScriptContent} from "app/api";
import Storage from "app/_sys/storage";
import { publish, CONTENT_ACTIVATED } from "app/_sys/pubsub";
import ResultsPane from "app/ui/results-pane/results-pane"

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

export default class Content {

    private readonly container: Element;
    private active: Element;
    private stickyId: string;

    public static instance: Content;

    constructor(element: Element) {
        this.container = element;
        Content.instance = this;
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
    }

    public async createNewContent(id: string, key: Keys, data: ItemInfoType, contentArgs = {content: null, sticky: false}) {
        if (contentArgs.sticky) {
            this.stickyId = id;
        }
        const newElement = this.createElement(id, key, contentArgs.content, data)
            .hideElement()
            .attr("id", id)
            .dataAttr("key", key)
            //.dataAttr("data", data)
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

        publish(CONTENT_ACTIVATED, (e.dataAttr("data") as ItemInfoType).name);
        return true;
    }

    public getContent(id: string) {
        const e = this.getContentElement(id);
        if (!e.length) {
            return null;
        }
        const editor = e.dataAttr("editor") as IEditor;
        if (editor) {
            return editor.getContent();
        }
        return e.html().trim();
    }

    public remove(id: string) {
        const e = this.getContentElement(id);
        if (!e.length) {
            return
        }
        this.editor(e).dispose();
        e.remove();

        if (this.container.children.length == 0) {
            publish(CONTENT_ACTIVATED, null);
        }
    }

    public actionRun(id: string) {
        this.editor(this.active).actionRun(id);
    }

    public getAllContent() : Array<{id: string, key: Keys, data: ItemInfoType, active: boolean}> {
        const result = new Array<{id: string, key: Keys, data: ItemInfoType, active: boolean}>();
        for(let e of this.container.children) {
            result.push({id: e.id, key: e.dataAttr("key"), data: e.dataAttr("data"), active: e.hasClass(classes.active)})
        }
        return result;
    }
    
    private createElement(id: string, key: Keys, content: IScriptContent, data: ItemInfoType) {
        if (key == Keys.SCRIPTS) {
            return this.createSplitEditor(id, Languages.PGSQL, content, data);
        }
        return (String.html`
            <div>
                ${key.toString()}:  ${data.id}
            </div>` as string)
                .toElement()
                .dataAttr("data", data)
    }

    private createSplitEditor(id: string, lang: Languages, content: IScriptContent, data: ItemInfoType) {
        const element = (String.html`
            <div>
                <div class="editor"></div>
                <div></div>
                <div class="results-pane"></div>
            </div>` as string)
            .toElement()
            .addClass("split-content")
            .css("grid-template-rows", `auto 5px ${_getSplitterVal(id).height}px`)
            .dataAttr("data", data);
        
        const editor = new Editor(id, element.children[0], element, lang, content);
        element.dataAttr("editor", editor);

        const results = new ResultsPane(id, element.children[2], data);
        element.dataAttr("results", results);

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
