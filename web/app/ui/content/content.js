define(["require", "exports", "app/ui/content/editor", "app/controls/splitter", "app/api", "app/_sys/storage"], function (require, exports, editor_1, splitter_1, api_1, storage_1) {
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
        disposeEditor(id) {
            const e = this.getContentElement(id);
            if (!e.length) {
                return;
            }
            this.editor(e).dispose();
        }
        async createOrActivateContent(id, key, data, contentArgs = { content: null, sticky: false }) {
            if (contentArgs.sticky) {
                if (this.stickyId && id != this.stickyId) {
                    const e = this.getContentElement(this.stickyId);
                    if (e.length) {
                        this.editor(e).dispose();
                        e.remove();
                    }
                }
                this.stickyId = id;
            }
            await this.createNewContent(id, key, data, contentArgs);
            this.activate(id);
        }
        async createNewContent(id, key, data, contentArgs = { content: null, sticky: false }) {
            if (contentArgs.sticky) {
                this.stickyId = id;
            }
            const newElement = this.createElement(id, key, contentArgs.content)
                .hideElement()
                .attr("id", id)
                .dataAttr("key", key)
                .dataAttr("data", data)
                .addClass("content")
                .appendElementTo(this.container);
            if (!contentArgs.content && key === api_1.Keys.SCRIPTS) {
                const response = await api_1.fetchScriptContent(data.connection, data.id);
                if (response.ok) {
                    this.editor(newElement).setContent(response.data);
                }
            }
        }
        setStickStatus(id, value) {
            if (value) {
                this.stickyId = id;
            }
            else {
                this.stickyId = undefined;
            }
        }
        activate(id) {
            const e = this.getContentElement(id);
            if (!e.length) {
                return false;
            }
            if (this.active) {
                this.active.hideElement().removeClass(api_1.classes.active);
            }
            this.active = e.showElement().addClass(api_1.classes.active);
            setTimeout(() => this.editor(e).layout().focus());
            return true;
        }
        remove(id) {
            const e = this.container.find("#" + id);
            if (!e.length) {
                return;
            }
            this.editor(e).dispose();
            e.remove();
        }
        createElement(id, key, content = null) {
            if (key == api_1.Keys.SCRIPTS) {
                return this.createSplitEditor(id, api_1.Languages.PGSQL, content);
            }
            return String.html `
            <div>
                ${key.toString()}:  ${id}
            </div>`
                .toElement();
        }
        createSplitEditor(id, lang, content = null) {
            const element = String.html `
            <div>
                <div class="editor"></div>
                <div></div>
                <div class="grid"></div>
            </div>`
                .toElement()
                .addClass("split-content")
                .css("grid-template-rows", `auto 5px ${_getSplitterVal(id).height}px`);
            const editor = new editor_1.Editor(id, element.children[0], element, lang);
            element.dataAttr("editor", editor);
            new splitter_1.HorizontalSplitter({
                element: element.children[1],
                container: element,
                resizeIndex: 2,
                maxDelta: 100,
                min: 25,
                events: {
                    docked: () => { editor.layout(); },
                    undocked: () => { editor.layout(); },
                    changed: () => { editor.layout(); }
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
        editor(e) {
            const editor = e.dataAttr("editor");
            if (editor) {
                return editor;
            }
            return editor_1.nullEditor;
        }
        getContentElement(id) {
            return this.container.find("#" + id);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=content.js.map