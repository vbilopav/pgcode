import { 
    subscribe, STATE_CHANGED_SCRIPTS, STATE_CHANGED_TABLES, STATE_CHANGED_VIEWS, STATE_CHANGED_FUNCS, STATE_CHANGED_SEARCH
} from "app/_sys/pubsub";
import { IPanel } from "app/types";
import Scripts from "app/ui/side-panel/scripts";
import Tables from "app/ui/side-panel/tables";
import Views from "app/ui/side-panel/views";
import Funcs from "app/ui/side-panel/funcs";
import Search from "app/ui/side-panel/search";

export default class  {
    constructor(element: Element){
        element.addClass("side-panel").html(String.html`
            <div style="display: none;">scripts</div>
            <div style="display: none;">tables</div>
            <div style="display: none;">views</div>
            <div style="display: none;">funcs</div>
            <div style="display: none;">search</div>
        `);
        const panels: Record<string, IPanel> = {
            "scripts": new Scripts(element.children[0]),
            "tables": new Tables(element.children[1]),
            "views": new Views(element.children[3]),
            "funcs": new Funcs(element.children[4]),
            "search": new Search(element.children[5])
        };
        
        subscribe([
            STATE_CHANGED_SCRIPTS, STATE_CHANGED_TABLES, STATE_CHANGED_VIEWS, STATE_CHANGED_FUNCS, STATE_CHANGED_SEARCH
        ], (key: string, state: boolean) => {
            panels[key].show(state);
        });
    }
}
