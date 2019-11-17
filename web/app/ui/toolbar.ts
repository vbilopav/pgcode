export default class  {
    constructor(element: HTMLElement){
        element.addClass("toolbar").html(String.html`
            <div class="icon-doc-text"></div>
            <div class="icon-database"></div>
            <div class="icon-search"></div>
            <div class="icon-terminal"></div>
        `);

        console.log(element);
    }
}