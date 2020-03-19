
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
import { ItemInfoType, IRoutineInfo, IScriptInfo, ITableInfo, Keys } from "app/api";


export default class  {
    private container: Element;
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
        var e = this.container.find("#" + id);
        if (!e.length) {
            return
        }
        if (this.active) {
            this.active.hideElement();
        }
        this.active = e.showElement();
    }

    public createElement(id: string, key: Keys, data: ItemInfoType) {
        return (String.html`
        <div>
            ${key.toString()}:  ${data.name}
        </div>` as string)
        .toElement()
    }
}
