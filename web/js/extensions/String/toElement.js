define(["js/extensions/html", "js/extensions/test-proto"], (html, test) => {

    test(String, ["toElement"]);

    String.prototype.toElement = function() {
        return html.strToElement(this);
    }
});