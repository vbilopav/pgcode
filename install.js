const fs = require("fs");
const {walkSync, mkDirByPathSync, rmdirSync, cleanPath} = require("./node_modules/ihjs/tools/modules/utils");

function copy(obj, from, to) {
    var toFile = cleanPath(obj.full.replace(cleanPath(from), cleanPath(to)));
    var toDir = toFile.replace(obj.file, "");
    var from = obj.full;

    mkDirByPathSync(toDir);
    
    console.log(`install >>> copying ${from} to ${toFile}`);
    fs.copyFileSync(from, toFile);
}

rmdirSync("src/libs/ihjs");
for (let obj of walkSync("node_modules/ihjs/build/1.2.8")) {
    copy(obj, "node_modules/ihjs/build/1.2.8", "src/libs/ihjs");
}
rmdirSync("src/libs/monaco-editor");
for (let obj of walkSync("node_modules/monaco-editor/min")) {
    copy(obj, "node_modules/monaco-editor/min", "src/libs/monaco-editor/min");
}
var from = "node_modules/monaco-editor/monaco.d.ts";
var to = "src/libs/monaco-editor/monaco.d.ts";
console.log(`install >>> copying ${from} to ${to}`);
fs.copyFileSync(from, to);
