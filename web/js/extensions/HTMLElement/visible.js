define(["js/extensions/test-proto", "js/extensions/HTMLElement/css"], test => {

    test(HTMLElement, ["visible",]);

    HTMLElement.prototype.visible = function(state) {
        if (state !== undefined) {
            if (!state) {
                return this.css("visibility", "hidden");
            }
        }
        this.css("visibility", "visible");
        return this;
    }
});