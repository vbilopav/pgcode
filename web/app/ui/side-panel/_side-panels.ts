import { 
    subscribe, 
    STATE_CHANGED_SCRIPTS, 
    STATE_CHANGED_TABLES, 
    STATE_CHANGED_VIEWS, 
    STATE_CHANGED_ROUTINES, 
    STATE_CHANGED_SEARCH,
    TAB_SELECTED
} from "app/_sys/pubsub";
import MainPanel from "app/ui/main-panel/main-panel";
import Panel from "app/ui/side-panel/panel"
import Scripts from "app/ui/side-panel/scripts";
import { Tables, Views } from "app/ui/side-panel/tables";
import Routines from "app/ui/side-panel/routines";
import Search from "app/ui/side-panel/search";
import { Keys, ISidePanel, getCurrentSchema, getCurrentConnection } from "app/api";

export default class implements ISidePanel {
    private panels: Map<Keys, Panel> = new Map<Keys, Panel>();

    constructor(element: Element, mainPanel: MainPanel) {
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
        
        this.panels.set(Keys.SCRIPTS, new Scripts(element.children[0]).setMainPanelRef(mainPanel).setSidePanelRef(this));
        this.panels.set(Keys.TABLES, new Tables(element.children[1]).setMainPanelRef(mainPanel).setSidePanelRef(this));
        this.panels.set(Keys.VIEWS, new Views(element.children[2]).setMainPanelRef(mainPanel).setSidePanelRef(this));
        this.panels.set(Keys.ROUTINES, new Routines(element.children[3]).setMainPanelRef(mainPanel).setSidePanelRef(this));
        this.panels.set(Keys.SEARCH, new Search(element.children[4]).setMainPanelRef(mainPanel).setSidePanelRef(this));
        
        subscribe([
            STATE_CHANGED_SCRIPTS, 
            STATE_CHANGED_TABLES, 
            STATE_CHANGED_VIEWS, 
            STATE_CHANGED_ROUTINES, 
            STATE_CHANGED_SEARCH
        ], (key: Keys, state: boolean) => {
            this.panels.get(key).show(state);
        });

        subscribe(TAB_SELECTED, (_, key: Keys, schema: string, connection: string) => { //!!
            if (!key) {
                return;
            }
            if (schema !== getCurrentSchema() && connection !== getCurrentConnection()) {
                return;
            }
            for(let [current, panel] of this.panels) {
                if (key == current) {
                    panel.show(true);
                } else {
                    panel.show(false);
                }
            }
        });
    }

    public unselectAll() {
        for(let panel of this.panels.values()) {
            panel.unselectAll();
        }
    }
}
