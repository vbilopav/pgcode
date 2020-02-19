export default abstract class Panel {
    protected readonly element: Element;
    protected readonly header: Element;
    protected readonly items: Element;
    protected itemScrollTimeout: number;

    constructor(element: Element, title: string){
        this.element = element;
        this.header = element.children[0].html(String.html`
            <div>${title}</div>
            <div>
                <span class="btn">&nbsp;&#8942;&nbsp;</span>
            </div>
        `);
        this.items = element.children[1];

        this.items.on("mouseleave", event => {
            let e = (event.target as Element);
            e.css("overflow-y", "hidden").css("z-index", "");
        }).on("mouseenter", event => {
            let e = (event.target as Element);
            if (e.scrollHeight > e.clientHeight) {
                e.css("overflow-y", "scroll").css("z-index", "1");
            }
        }).on("scroll", () => this.toggleHeaderShadow());
        this.toggleHeaderShadow();
    }

    show(state: boolean) {
        this.element.showElement(state);
    }

    private toggleHeaderShadow() {
        if (this.itemScrollTimeout) {
            clearTimeout(this.itemScrollTimeout);
        }
        this.itemScrollTimeout = setTimeout(() => {
            if (this.items.scrollHeight > this.items.clientHeight && this.items.scrollTop) {
                this.header.addClass("shadow");
            } else {
                this.header.removeClass("shadow");
            }
            this.itemScrollTimeout = undefined;
        }, 5);
    }
}