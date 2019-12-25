export default class  {
    constructor(element: Element) {
        element.addClass("footer").html(String.html`
            <div class="conns">
                <span class="icon-database"></span>
                Connection not selected
            </div>
            <div class="feed clickable" title="Send feedback">&#128526;</div>
        `);
    }
}