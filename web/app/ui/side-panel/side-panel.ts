import { 
    subscribe, STATE_CHANGED_DOCS, STATE_CHANGED_TABLES, STATE_CHANGED_VIEWS, STATE_CHANGED_FUNCS, STATE_CHANGED_SEARCH,
} from "app/_sys/pubsub";


export default class  {
    constructor(element: Element){
        element.addClass("side-panel").html(String.html`
            <div class="panel-docs" style="display: none;">docs</div>
            <div class="panel-tables" style="display: none;">tables</div>
            <div class="panel-views" style="display: none;">views</div>
            <div class="panel-funcs" style="display: none;">funcs</div>
            <div class="panel-search" style="display: none;">search</div>
        `);

        subscribe([
            STATE_CHANGED_DOCS, STATE_CHANGED_TABLES, STATE_CHANGED_VIEWS, STATE_CHANGED_FUNCS, STATE_CHANGED_SEARCH
        ], (key: string, state: boolean) => {
            element.find(`.panel-${key}`).showElement(state);
        });
    }
}