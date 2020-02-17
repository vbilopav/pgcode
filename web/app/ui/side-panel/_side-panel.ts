import { 
    subscribe, STATE_CHANGED_SCRIPTS, STATE_CHANGED_TABLES, STATE_CHANGED_VIEWS, STATE_CHANGED_ROUTINES, STATE_CHANGED_SEARCH
} from "app/_sys/pubsub";
import { IPanel } from "app/types";
import Scripts from "app/ui/side-panel/scripts";
import Tables from "app/ui/side-panel/tables";
import Views from "app/ui/side-panel/views";
import Routines from "app/ui/side-panel/routines";
import Search from "app/ui/side-panel/search";
import { keys } from "app/types";


export default class  {
    constructor(element: Element){
        element.addClass("side-panel").html(String.html`
            <div style="display: none;"></div>
            <div style="display: none;"></div>
            <div style="display: none;"></div>
            <div style="display: none;"></div>
            <div style="display: none;"></div>
        `);
        const panels: Record<string, IPanel> = {};
        panels[keys.scripts] = new Scripts(element.children[0]);
        panels[keys.tables] = new Tables(element.children[1]);
        panels[keys.views] = new Views(element.children[2]);
        panels[keys.routines] = new Routines(element.children[3]);
        panels[keys.search] = new Search(element.children[4]);
        
        subscribe([
            STATE_CHANGED_SCRIPTS, 
            STATE_CHANGED_TABLES, 
            STATE_CHANGED_VIEWS, 
            STATE_CHANGED_ROUTINES, 
            STATE_CHANGED_SEARCH
        ], (key: string, state: boolean) => {
            panels[key].show(state);
        });
    }
}
