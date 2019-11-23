define(["js/extensions/test-proto", "js/extensions/HTMLElement/css"], test => {
        
    test(HTMLElement, ["hideElement"]);

    HTMLElement.prototype.hideElement = function() {
        this.css("display", "none");
        return this;
    }
});