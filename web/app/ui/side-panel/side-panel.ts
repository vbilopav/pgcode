import { 
    subscribe, publish,
    STATE_CHANGED_DOCS, STATE_CHANGED_TABLES, STATE_CHANGED_VIEWS, STATE_CHANGED_FUNCS, STATE_CHANGED_SEARCH, 
    STATE_CHANGED_ON, STATE_CHANGED_OFF,
    SIDEBAR_DOCKED, SIDEBAR_UNDOCKED
} from "app/_sys/pubsub";
import {VerticalSplitter, SplitterCtorArgs} from "app/controls/splitter";

export default class  {
    private splitter: VerticalSplitter;

    constructor(element: Element, splitter: Element, container: Element){
        element.addClass("side-panel").html(String.html`
            <div class="panel-docs" style="display: none;">docs</div>
            <div class="panel-tables" style="display: none;">tables</div>
            <div class="panel-views" style="display: none;">views</div>
            <div class="panel-funcs" style="display: none;">funcs</div>
            <div class="panel-search" style="display: none;">search</div>
        `);

        this.splitter = new VerticalSplitter({
            name: "v-splitter",
            element: container.children[2],
            container: container,
            resizeIdx: 1,
            autoIdx: 3,
            maxResizeDelta: 100,
            events: {
                docked: () => publish(SIDEBAR_DOCKED),
                undocked: () => publish(SIDEBAR_UNDOCKED),
                changed: () => {}, //_app.pub("sidebar/changed", splitter)
            }
        } as SplitterCtorArgs);

        this.splitter.start();

        subscribe([
            STATE_CHANGED_DOCS, STATE_CHANGED_TABLES, STATE_CHANGED_VIEWS, STATE_CHANGED_FUNCS, STATE_CHANGED_SEARCH
        ], (key: string, state: boolean) => {
            element.find(`.panel-${key}`).showElement(state);
        });

        subscribe(STATE_CHANGED_ON, () => {
            if (this.splitter.isDocked) {
                this.splitter.undock();
            }
        });
        subscribe(STATE_CHANGED_OFF, () => {
            if (!this.splitter.isDocked) {
                this.splitter.dock();
            }
        });
    }
}