define(["js/extensions/html", "js/extensions/test-proto"], (html, test) => {

    test(String, ["dom"]);

    String.prototype.dom = function() {
        return html.strToElement(this);
    }
});