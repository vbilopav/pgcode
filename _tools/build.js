const fs = require("fs");
const path = require("path");
const uglifyEs = require("uglify-es");
const  minifyHtml = require('html-minifier').minify;
const {walkSync, rmdirSync, getConfig, mkDirByPathSync, cleanPath, isSameDir, getTimeStamp} = require("./utils");

const config = getConfig("_tools/build-config.js");

function log() {
    if (config.silent) {
        return;
    }
    if (!arguments.length) {
        console.log('');
    } else {
        let args = [getTimeStamp()].concat(...arguments);
        console.log(...args);
    }
}

function copy(obj, from, to, stripSourceMapping=false) {
    var toFile = cleanPath(obj.full.replace(cleanPath(from), cleanPath(to)));
    var toDir = toFile.replace(obj.file, "");
    var from = obj.full;

    mkDirByPathSync(toDir);

    if (stripSourceMapping && obj.full.endsWith(".js")) {
        log(`>>> copying ${from} to ${toFile} and removing sourceMappingURL...`);
        let content = fs.readFileSync(from).toString();
        let i = content.lastIndexOf("//# sourceMappingURL");
        if (i === -1) {
            fs.writeFileSync(toFile, content, "utf8");
        } else {
            let l = content.indexOf(".map", i);
            content = content.slice(0, i) + content.slice(l + ".map".length, content.length);
            fs.writeFileSync(toFile, content, "utf8");
        }
    } else {
        log(`>>> copying ${from} to ${toFile}`);
        fs.copyFileSync(from, toFile);
    }
}

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
            obj.file != "pgsql.js" &&
            obj.file != "codicon.ttf"
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
    //index.html
    var from = cleanPath(config.sourceDir + "/" + "index.html");
    var to = cleanPath(config.targetDir + "/" + "index.html");
    
    log(`>>> copying ${from} to ${to}`);
    let content = fs.readFileSync(from).toString()
        .replace("location.hash = '';", "location.hash = '" + config.version + "';")
        .replace(/\.js"/g, ".js" + "?" + config.version + "\"")
        .replace(/\.json"/g, ".json" + "?" + config.version + "\"")
        .replace(/\.css"/g, ".css" + "?" + config.version + "\"")
        .replace(/\.ico"/g, ".ico" + "?" + config.version + "\"");
    fs.writeFileSync(to, content, "utf8");

    //favicon.ico
    var from = cleanPath(config.sourceDir + "/" + "favicon.ico");
    var to = (config.targetDir + "/" + "favicon.ico");
    
    log(`>>> copying ${from} to ${to}`);
    fs.copyFileSync(from, to);
/*
    //manifest.json
    var from = cleanPath(config.sourceDir + "/" + "manifest.json");
    var to = (config.targetDir + "/" + "manifest.json");
    
    log(`>>> copying ${from} to ${to}`);
    fs.copyFileSync(from, to);

    //service-worker.js
    var from = cleanPath(config.sourceDir + "/" + "service-worker.js");
    var to = (config.targetDir + "/" + "service-worker.js");
    
    log(`>>> copying ${from} to ${to}`);
    fs.copyFileSync(from, to);

    //postgresql-512.png
    var from = cleanPath(config.sourceDir + "/" + "postgresql-512.png");
    var to = (config.targetDir + "/" + "postgresql-512.png");
    
    log(`>>> copying ${from} to ${to}`);
    fs.copyFileSync(from, to);
*/
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

function minifyHtmlFromContent(content) {
    if (!config.minifyHtml) {
        return content;
    }
    const tag = "String.html`";
    var result = "", len = tag.length, from = 0;
    while (true) {
        let i = content.indexOf(tag, from);
        if (i === -1) {
            break;
        }
        let j = content.indexOf("`", i + len);
        if (j === -1) {
            break;
        }        
        let html = minifyHtml(content.substring(i + len, j), config.minifyHtml)
        result = result + content.substring(from, i + len) + html + "`";
        from = j + 1;
    }
    if (from < content.length) {
        result = result + content.substring(from, content.length);
    }
    return result;
}

function getContent(filename, options){
    if (filename === config.entryPointFile) {
        let content = fs.readFileSync(filename).toString().replace('urlArgs: "", //auto', 'urlArgs: "' + config.version + '",');
        return options ? minify(content, options) : content;
    } else {
        return options ? minify(fs.readFileSync(filename).toString(), options) : fs.readFileSync(filename).toString();
    }
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
        
        if (config.minifyHtml) {
            moduleContent = minifyHtmlFromContent(moduleContent);
        }

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

var isSilent = config.silent;
config.silent = false;
console.log("");
log("STARTED");
config.silent = isSilent;
console.log("configuration:\n", config);
console.log("");

recreateTargetDir();
copyCss();
copyLibs();
copyFonts();
copyRootFiles();
buildBundle();

config.silent = false;
log("BUILD FINISHED");
