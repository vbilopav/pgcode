define(["js/extensions/test-proto"], test => {

    test(HTMLElement, ["overflownX"]);

    HTMLElement.prototype.overflownX = function() {
        return this.scrollWidth > this.clientWidth;
    }
});