import { 
    subscribe, STATE_CHANGED_SCRIPTS, STATE_CHANGED_TABLES, STATE_CHANGED_VIEWS, STATE_CHANGED_ROUTINES, STATE_CHANGED_SEARCH
} from "app/_sys/pubsub";
import MainPanel from "app/ui/main-panel/main-panel";
import Panel from "app/ui/side-panel/panel"
import Scripts from "app/ui/side-panel/scripts";
import Tables from "app/ui/side-panel/tables";
import Views from "app/ui/side-panel/views";
import Routines from "app/ui/side-panel/routines";
import Search from "app/ui/side-panel/search";
import { Keys } from "app/types";


export default class  {
    constructor(element: Element, mainPanel: MainPanel){
        element.addClass("side-panel").html(String.html`
            <div style="display: none;">
                <div></div>
                <div></div>
            </div>
            <div style="display: none;">
                <div></div>
                <div></div>
            </div>
            <div style="display: none;">
                <div></div>
                <div></div>
            </div>
            <div style="display: none;">
                <div></div>
                <div></div>
            </div>
            <div style="display: none;">
                <div></div>
                <div></div>
            </div>
        `);
        const panels: Record<string, Panel> = {};
        panels[Keys.SCRIPTS] = new Scripts(element.children[0]).setMainPanelRef(mainPanel);
        panels[Keys.TABLES] = new Tables(element.children[1]).setMainPanelRef(mainPanel);;
        panels[Keys.VIEWS] = new Views(element.children[2]).setMainPanelRef(mainPanel);;
        panels[Keys.ROUTINES] = new Routines(element.children[3]).setMainPanelRef(mainPanel);;
        panels[Keys.SEARCH] = new Search(element.children[4]).setMainPanelRef(mainPanel);;
        
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
