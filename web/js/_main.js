define(["js/extensions/apply"], ({loadExtensions, applyExtensions, applyExtensionsExcept}) => {

    loadExtensions({
        "HTMLElement": [
            "addClass", "appendElement", "appendElementTo", "attr", "css", "dataAttr", "find", "findAll", "forEachChild", "hasClass",
            "hideElement", "html", "off", "on", "overflownX", "overflownY", "removeAttr", "removeClass", "setFocus", "showElement", 
            "toggleClass", "trigger", "visible", "clone", "switchPlaces", "nextElementSiblingWithClass"
        ],
        "String": ["hashCode", "html", "toElement", "toCamelCase", "createElement"]
    }).then(() => {
    
        applyExtensionsExcept("NodeList", "HTMLElement", ["find", "findAll"], true);
        applyExtensionsExcept("HTMLCollection", "HTMLElement", ["find", "findAll"], true);
        applyExtensions("Document", ["on", "off", "trigger", "find", "findAll"]);
        applyExtensions("Window", ["on", "off", "trigger"]);

        require(["app/index"], () => {})

    });
});
