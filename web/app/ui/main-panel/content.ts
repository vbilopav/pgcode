
import "vs/editor/editor.main";
                /*
        monaco.editor.create(element as HTMLElement, {
            value: "",
            language: "pgsql",
            theme: "vs-dark",
            renderWhitespace: "all",
            automaticLayout: false
        });
        */
import {HorizontalSplitter, SplitterCtorArgs} from "app/controls/splitter";
import {ItemInfoType, IRoutineInfo, IScriptInfo, ITableInfo, Keys} from "app/api";
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
    ) as any as IStorage;
const
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

    public createNew(id: string, key: Keys, data: ItemInfoType) {
        if (this.active) {
            this.active.hideElement();
        }
        this.active = this.createElement(id, key, data)
            .hideElement()
            .attr("id", id)
            .dataAttr("key", key)
            .dataAttr("data", data)
            .addClass("content")
            .appendElementTo(this.container)
    }

    public activate(id: string) {
        const e = this.container.find("#" + id);
        if (!e.length) {
            return
        }
        if (this.active) {
            this.active.hideElement();
        }
        this.active = e.showElement();
    }
    
    public createElement(id: string, key: Keys, data: ItemInfoType) {
        if (key == Keys.SCRIPTS) {
            const element = (String.html`
                <div>
                    <div class="editor">${data.name}</div>
                    <div></div><!-- main splitter vertical -->
                    <div class="grid"></div><!-- main panel -->
                </div>` as string)
                .toElement()
                .addClass("split-content")
                .css("grid-template-rows", `auto 5px ${_getSplitterVal(id).height}px`);
            
            new HorizontalSplitter({
                element: element.children[1],
                container: element,
                resizeIndex: 2,
                maxDelta: 100,
                min: 25,
                
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
                } as any
                
            } as SplitterCtorArgs).start();
            
            return element;
        } 
        
        return (String.html`
            <div>
                ${key.toString()}:  ${data.name}
            </div>` as string)
                .toElement()
    }
}
