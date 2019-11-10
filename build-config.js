/**
 * build configuration
 */
({
    version: "1",
    outputDir: "../../../_build/app",
    bundleFile: 'index.js',
    copyNonJsFiles: false,
    bundleComment: 'build: ${this.timestamp}, version: ${this.version}',
    appDir: "../../../src/app",
    
    minifyDefault: true,
    minifyLoader: true,
    
    minifyModules: {},
})