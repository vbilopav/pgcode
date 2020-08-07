const fs = require("fs");
const {walkSync, rmdirSync, cleanPath, mkDirByPathSync} = require("./utils");


function copy(obj, from, to) {
    var toFile = cleanPath(obj.full.replace(cleanPath(from), cleanPath(to)));
    var toDir = toFile.replace(obj.file, "");
    var from = obj.full;

    mkDirByPathSync(toDir);

    console.log(`install >>> copying ${from} to ${toFile}`);
    fs.copyFileSync(from, toFile);
}

function copyToAmdFormat(from, to) {
    console.log(`install >>> copying ${from} to ${to} with AMD format`);
    let content = fs.readFileSync(from).toString();
    fs.writeFileSync(to, "define(function (require, exports, module) {module.exports = exports; " + content + " });", "utf8");
}


rmdirSync("web/libs/monaco-editor");

for (let obj of walkSync("node_modules/monaco-editor/min")) {
    copy(obj, "node_modules/monaco-editor/min", "web/libs/monaco-editor/min");
}
for (let obj of walkSync("node_modules/monaco-editor/min-maps")) {
    copy(obj, "node_modules/monaco-editor/min-maps", "web/libs/monaco-editor/min-maps");
}

var from = "node_modules/monaco-editor/monaco.d.ts";
var to = "web/libs/monaco-editor/monaco.d.ts";
console.log(`install >>> copying ${from} to ${to}`);
fs.copyFileSync(from, to);


rmdirSync("web/libs/google-protobuf");
mkDirByPathSync("web/libs/google-protobuf");

var from = "node_modules/google-protobuf/google-protobuf.js";
var to = "web/libs/google-protobuf/google-protobuf.js";
copyToAmdFormat(from, to);


rmdirSync("web/libs/grpc-web");
mkDirByPathSync("web/libs/grpc-web");

var from = "node_modules/grpc-web/index.js";
var to = "web/libs/grpc-web/index.js";
copyToAmdFormat(from, to);
