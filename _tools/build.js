const fs = require("fs");
const path = require("path");
const uglifyEs = require("uglify-es");
const {walkSync, rmdirSync, copy, getConfig, log, mkDirByPathSync, cleanPath, isSameDir} = require("./utils");

const config = getConfig("_tools/build-config.js");

function recreateTargetDir() {
    rmdirSync(config.targetDir);
    mkDirByPathSync(config.targetDir);
}

function copyCss() {
    const cssDirSource = config.sourceDir + "/" + config.cssName;
    const cssDirTarget = config.targetDir + "/" + config.cssName;
    for (let obj of walkSync(cssDirSource)) {
        if (!obj.full.endsWith(".css")) {
            continue;
        }
        copy(obj, cssDirSource, cssDirTarget);
    }
}

function copyLibs() {
    const libsDirSource = config.sourceDir + "/" + config.libsName;
    const libsDirTarget = config.targetDir + "/" + config.libsName;

    for (let obj of walkSync(libsDirSource)) {
        if (
            obj.file != "editor.main.js" && 
            obj.file != "editor.main.css" && 
            obj.file != "editor.main.nls.js" &&
            obj.file != "workerMain.js" &&
            obj.file != "pgsql.js" 
        ) {
            continue;
        }
        copy(obj, libsDirSource, libsDirTarget, true);
    }
}

function copyFonts() {
    const fontsDirSource = config.sourceDir + "/" + config.fontsName;
    const fontsDirTarget = config.targetDir + "/" + config.fontsName;
    for (let obj of walkSync(fontsDirSource)) {
        copy(obj, fontsDirSource, fontsDirTarget);
    }
}

function copyRootFiles() {
    var from = cleanPath(config.sourceDir + "/" + "index.html");
    var to = cleanPath(config.targetDir + "/" + "index.html");
    
    console.log(`>>> copying ${from} to ${to}`);
    fs.copyFileSync(from, to);

    var from = cleanPath(config.sourceDir + "/" + "favicon.ico");
    var to = (config.targetDir + "/" + "favicon.ico");
    
    console.log(`>>> copying ${from} to ${to}`);
    fs.copyFileSync(from, to);
}

function recreateOutputDir() {
    rmdirSync(config.outputDir);
    mkDirByPathSync(config.outputDir);
}

function minify(content, options) {
    let ret = uglifyEs.minify(content, options === true ? null : options);
    if (ret.error) {
        throw `${ret.error.message}, pos: ${ret.error.pos}, col: ${ret.error.col}`;
    }
    return ret.code;
}

function getContent(filename, options){
    return options ? minify(fs.readFileSync(filename).toString(), options) : fs.readFileSync(filename).toString();
}

function buildBundle() {

    const sourceFile = config.entryPointFile;
    const bundleFile = config.bundleFile;
    const loaderDir = path.dirname(config.loaderFile);
    let bundleContent = " require.config({_modules:{";
    let hasBundles = false;

    recreateOutputDir();

    if (config.bundleComment) {
        log('>>> Writing bundle comment header ...');
        fs.appendFileSync(bundleFile, "/*".concat(config.bundleComment).concat("*/\n"), "utf8");
    }

    log('>>> Writing module loader to bundle ...');
    fs.appendFileSync(bundleFile, getContent(config.loaderFile, config.minifyLoader), "utf8");
    log();


    for (let frameworkItem of walkSync(config.frameworkDir)) {
        const 
            frameworkDir = cleanPath(frameworkItem.dir),
            frameworkFile = cleanPath(frameworkItem.full),
            moduleNameClean = cleanPath(frameworkFile.replace(config.frameworkDir, ""));

        if (isSameDir(loaderDir, frameworkDir)) {
            continue;
        }
        if (path.extname(frameworkItem.full).toLowerCase() !== ".js") {
            continue;
        }
        if (frameworkFile == sourceFile) {
            continue;
        }
        let 
            moduleContent = getContent(frameworkFile, config.minifyDefault);
        let 
            moduleName = config.frameworkModulePrefix + moduleNameClean.replace(new RegExp("\\"+path.sep, 'g'), "/").replace(".js", "");

        log('>>> Bundling module ...', moduleName);
        bundleContent = bundleContent + `'${moduleName}': [`;
        bundleContent = bundleContent + moduleContent.substring(moduleContent.indexOf("define(") + "define(".length, moduleContent.lastIndexOf(")"));
        bundleContent = bundleContent + '],';
        hasBundles = true;
    }

    for (let appItem of walkSync(config.appDir)) {
        const 
            appFile = cleanPath(appItem.full),
            moduleNameClean = cleanPath(appFile.replace(config.appDir, ""));

        if (path.extname(appItem.full).toLowerCase() !== ".js") {
            continue;
        }
        if (appFile == sourceFile) {
            continue;
        }
        let 
            moduleContent = getContent(appFile, config.minifyDefault);
        let 
            moduleName = config.appModulePrefix + moduleNameClean.replace(new RegExp("\\"+path.sep, 'g'), "/").replace(".js", "");

        log('>>> Bundling module ...', moduleName);
        bundleContent = bundleContent + `'${moduleName}': [`;
        bundleContent = bundleContent + moduleContent.substring(moduleContent.indexOf("define(") + "define(".length, moduleContent.lastIndexOf(")"));
        bundleContent = bundleContent + '],';
        hasBundles = true;
    }

    if (hasBundles) {
        log('>>> Writing bundle content...');
        fs.appendFileSync(bundleFile, bundleContent + "}});", "utf8");
        log('>>> Done!');
        log();
    }

    log('>>> Writing entry point ...');
    fs.appendFileSync(bundleFile, getContent(sourceFile, config.minifyDefault), "utf8");
    log('>>> Done!');
    log();
}

console.log("");
console.log("configuration:\n", config);
log("STARTED");

recreateTargetDir();
copyCss();
copyLibs();
copyFonts();
copyRootFiles();
buildBundle();

