define(["js/extensions/test-proto"], test => {

    test(HTMLElement, ["nextElementSiblingWithClass"]);

    HTMLElement.prototype.nextElementSiblingWithClass = function(className) {
        const e = this.nextElementSibling;
        if (e.hasClass(className)) {
            return e;
        } else {
            return e.nextElementSiblingWithClass(className);
        }
    }
});