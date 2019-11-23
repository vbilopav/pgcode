
({
    version: "0.1",

    targetDir: "_build",
    sourceDir: "web",

    cssName: "css",
    libsName: "libs",
    fontsName: "fonts",

    outputDir: "${this.targetDir}/js",
    bundleFile: '${this.outputDir}/index.js',

    frameworkDir: "${this.sourceDir}/js",
    entryPointFile: '${this.frameworkDir}/index.js',
    loaderFile: "${this.frameworkDir}/loader/loader.js",
    frameworkModulePrefix: "js",
    
    bundleComment: 'build: ${this.timestamp}, version: ${this.version}, copyright VB-Consulting',
    
    appDir: "${this.sourceDir}/app",
    appModulePrefix: "app",

    minifyDefault: true,
    minifyLoader: true,
})