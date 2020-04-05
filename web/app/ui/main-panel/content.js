define(["require", "exports", "app/ui/main-panel/editor", "app/controls/splitter", "app/api", "app/_sys/storage"], function (require, exports, editor_1, splitter_1, api_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _defaultSplitValue = { height: 50, docked: true };
    const _storage = new storage_1.default({ splitter: {} }, "content", (name, value) => JSON.parse(value), (name, value) => JSON.stringify(value)), _getSplitterVal = id => {
        const s = _storage.splitter, v = s[id];
        if (!v) {
            return _defaultSplitValue;
        }
        return v;
    }, _setSplitterVal = (id, item) => {
        const s = _storage.splitter, v = s[id];
        s[id] = { ...(v ? v : _defaultSplitValue), ...item };
        _storage.splitter = s;
    };
    class default_1 {
        constructor(element) {
            this.container = element;
        }
        createNew(id, key, data, content = null) {
            if (this.active) {
                this.active.hideElement();
            }
            this.active = this.createElement(id, key)
                .hideElement()
                .attr("id", id)
                .dataAttr("key", key)
                .dataAttr("data", data)
                .addClass("content")
                .appendElementTo(this.container);
            if (key === api_1.Keys.ROUTINES) {
                console.log(`get the content for routine with id ${data.id}`);
            }
            else if (key === api_1.Keys.SCRIPTS) {
                console.log(`get the content for script with id ${data.id}`);
            }
            else if (key === api_1.Keys.TABLES) {
                console.log(`get the content for table with id ${data.id}`);
            }
            else if (key === api_1.Keys.VIEWS) {
                console.log(`get the content for view with id ${data.id}`);
            }
            if (content !== null) {
                console.log("I haz a content", content);
            }
        }
        activate(id) {
            const e = this.container.find("#" + id);
            if (!e.length) {
                return;
            }
            if (this.active) {
                this.active.hideElement().removeClass(api_1.classes.active);
            }
            this.active = e.showElement().addClass(api_1.classes.active);
            setTimeout(() => this.executeEditor(e, editor => editor.layout()), 0);
        }
        remove(id) {
            const e = this.container.find("#" + id);
            if (!e.length) {
                return;
            }
            this.executeEditor(e, editor => editor.dispose());
            e.remove();
        }
        createElement(id, key) {
            if (key == api_1.Keys.SCRIPTS) {
                return this.createSplit(id, api_1.Languages.PGSQL);
            }
            return String.html `
            <div>
                ${key.toString()}:  ${id}
            </div>`
                .toElement();
        }
        createSplit(id, lang) {
            const element = String.html `
            <div>
                <div class="editor"></div>
                <div></div>
                <div class="grid"></div>
            </div>`
                .toElement()
                .addClass("split-content")
                .css("grid-template-rows", `auto 5px ${_getSplitterVal(id).height}px`);
            const editor = new editor_1.default(element.children[0], element, lang);
            element.dataAttr("editor", editor);
            new splitter_1.HorizontalSplitter({
                element: element.children[1],
                container: element,
                resizeIndex: 2,
                maxDelta: 100,
                min: 25,
                events: {
                    docked: () => editor.layout(),
                    undocked: () => editor.layout(),
                    changed: () => editor.layout()
                },
                storage: {
                    get position() {
                        return _getSplitterVal(id).height;
                    },
                    set position(value) {
                        _setSplitterVal(id, { height: value });
                    },
                    get docked() {
                        return _getSplitterVal(id).docked;
                    },
                    set docked(value) {
                        _setSplitterVal(id, { docked: value });
                    }
                }
            }).start();
            return element;
        }
        executeEditor(e, callback) {
            const editor = e.dataAttr("editor");
            if (editor) {
                callback(editor);
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=content.js.map