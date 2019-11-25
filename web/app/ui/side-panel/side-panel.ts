import { subscribe, STATE_CHANGED } from "app/_sys/pubsub";

export default class  {
    constructor(element: Element){
        element.addClass("side-panel").html(String.html`
            <div>docs</div>
            <div>tables</div>
            <div>views</div>
            <div>funcs</div>
            <div>search</div>
        `);

        subscribe(STATE_CHANGED, (key: string, state: boolean) => {
            console.log(key, state);
        });
    }
}