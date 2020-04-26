define(["js/extensions/test-proto", "js/extensions/HTMLElement/css"], test => {

    test(HTMLElement, ["clone"]);

    HTMLElement.prototype.clone = function(deep) {
        const result = this.cloneNode(deep);
        result._styles = this._styles;
        result._data = this._data;
        return result;
    }
});