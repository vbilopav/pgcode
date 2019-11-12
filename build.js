const fs = require("fs");
const {walkSync, mkDirByPathSync, rmdirSync, cleanPath} = require("./node_modules/ihjs/tools/modules/utils");

function copy(obj, from, to) {
    var toFile = cleanPath(obj.full.replace(cleanPath(from), cleanPath(to)));
    var toDir = toFile.replace(obj.file, "");
    var from = obj.full;

    mkDirByPathSync(toDir);
    
    console.log(`build >>> copying ${from} to ${toFile}`);
    fs.copyFileSync(from, toFile);
}

rmdirSync("_build");
mkDirByPathSync("_build");

for (let obj of walkSync("web/css")) {
    if (!obj.full.endsWith(".css")) {
        continue;
    }
    copy(obj, "web/css", "_build/css");
}
for (let obj of walkSync("web/libs")) {
    if (obj.full.indexOf("ihjs") != -1) {
        continue;
    }
    if (
        obj.file != "editor.main.js" && 
        obj.file != "editor.main.css" && 
        obj.file != "editor.main.nls.js" &&
        obj.file != "workerMain.js" &&
        obj.file != "pgsql.js" 
    ) {
        continue;
    }
    copy(obj, "web/libs", "_build/libs");
}
var from = "web/index.html";
var to = "_build/index.html";
console.log(`build >>> copying ${from} to ${to}`);

let content = fs.readFileSync(from).toString();
content = content.replace(
    '<script type="module" data-view-module="app/index" src="libs/ihjs/ihjs.js"></script>',
    '<script type="module" data-view-module="/index" src="app/index.js"></script>')
fs.writeFileSync(to, content, "utf8");
