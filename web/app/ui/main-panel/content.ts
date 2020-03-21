
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
import { ItemInfoType, IRoutineInfo, IScriptInfo, ITableInfo, Keys } from "app/api";
import {publish, SIDEBAR_DOCKED, SIDEBAR_UNDOCKED, SPLITTER_CHANGED} from "../../_sys/pubsub";


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

    /*
                <div></div><!-- side panel -->
                <div></div><!-- main splitter vertical -->
                <div></div><!-- main panel -->
    */
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
                .css("grid-template-rows", "auto 5px 50px");

            new HorizontalSplitter({
                element: element.children[1],
                container: element,
                resizeIndex: 2,
                maxDelta: 100,
                min: 25,
                /*
                events: {
                    docked: () => publish([SIDEBAR_DOCKED, SPLITTER_CHANGED]),
                    undocked: () => publish([SIDEBAR_UNDOCKED, SPLITTER_CHANGED]),
                    changed: () => publish(SPLITTER_CHANGED)
                },
                storage: {
                    get position() {
                        return storage.sidePanelWidth
                    },
                    set position(value: number) {
                        storage.sidePanelWidth = value;
                    },
                    get docked() {
                        return storage.sidePanelDocked
                    },
                    set docked(value: boolean) {
                        storage.sidePanelDocked = value;
                    }
                } as any
                */
                 
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
