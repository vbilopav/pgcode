///<reference path="../libs/ihjs/types/core.d.ts"/>

import Main from "./main";

export default class {
    model: {
        main: HTMLElement
    }

    render() {
        return String.html`
        <div class="sf-main">
            <div>toolbar</div>
            <div>sidebar</div>
            <div></div>
            <div id="main"></div>
            <div>footer</div>
        </div>
        `;
    }

    rendered() {
        new Main(this.model.main)
    }
}
