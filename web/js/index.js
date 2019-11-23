(function () {
    
    try { 
        Function("() => {};"); 
        window.customElements.get("test");
    } catch(e) { throw "update your browser!"; }

    const
        loaderUrl = "js/loader/loader.js",
        startModule = "js/_main",
        config = {
            urlArgs: "",
            baseUrl: "",
            paths: {
                "vs": "libs/monaco-editor/min/vs",
            }
        };

    const
        loadLoader = (src, onload) => {
            let script = document.createElement("script");
            script.async = true;
            script.src = src + (config.urlArgs ? "?" + config.urlArgs : "");
            script.onload = onload;
            script.onerror = onload;
            document.body.appendChild(script);
        }
    const
        loaderLoaded = () => window.require != undefined;
    const
        mainFunc = ()=>{};

    if (loaderLoaded()) {
        require.config(config);
        require([startModule], mainFunc);
    } else {
        loadLoader(loaderUrl, () => {
            if (loaderLoaded()) {
                require.config(config);
                require([startModule], mainFunc);
                return;
            }
            console.warn("Failed to load module loader.")
        });
    }

})();
