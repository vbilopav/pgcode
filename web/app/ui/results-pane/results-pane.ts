import { ItemInfoType, getConnectionColor, execute, IExecutionStream } from "app/api";
import Results from "app/ui/results-pane/results";
import Messages from "app/ui/results-pane/messages";
import { GrpcErrorCode } from "../../_sys/grpc-service";

export default class  {
    private readonly id: string;
    private readonly data: ItemInfoType;
    private readonly element: Element;
    private readonly tabs: HTMLCollection;
    private readonly panes: HTMLCollection;

    constructor(id: string, element: Element, data: ItemInfoType) {
        this.id = id;
        this.data = data;
        this.element = element.html(String.html`
            <div>
                <div class="tab" id="results" title="results">
                    <i class="icon-database"></i>
                    <span class="title">Results</span>
                    <div class="stripe" style="background-color: ${getConnectionColor(data.connection)}"></div>
                </div>
                <div class="tab" id="messages" title="messages">
                    <i class="icon-database"></i>
                    <span class="title">Messages</span>
                    <div class="stripe" style="background-color: ${getConnectionColor(data.connection)}"></div>
                </div>
            </div>
            <div>
                <div id="results"></div>
                <div id="messages"></div>
            </div>
        `);
        this.tabs = this.element.children[0].children.on("click", e => this.activateByTab(e.currentTarget as Element));
        this.panes = this.element.children[1].children;
        
        new Results(id, this.panes[0], data);
        new Messages(id, this.panes[1], data);

        this.activateByTab(this.tabs[0]);
    }

    public runExecution(content: string) {
        const stream = {
            error: e => {
                console.log(e);
                if (e.code == GrpcErrorCode.NotFound) {
                    // need to reconnect
                }
            },
            message: e => {
                console.log(e);
            },
            header: e => {
                console.log(e);
            },
            data: e => {
                console.log(e);
            },
            end: () => {
                console.log("end");
            }
        } as IExecutionStream;
        execute(this.data.connection, this.data.schema, this.id, content, stream);
    }

    private activateByTab(tab: Element) {
        for(let current of this.tabs) {
            current.toggleClass("active", tab.id == current.id);
        }
        for(let pane of this.panes) {
            pane.showElement(tab.id == pane.id);
        }
    }
}
