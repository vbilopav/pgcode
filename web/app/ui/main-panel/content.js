define(["require", "exports", "app/controls/splitter", "app/api", "app/_sys/storage", "vs/editor/editor.main"], function (require, exports, splitter_1, api_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _defaultSplitValue = { height: 50, docked: true };
    const _storage = new storage_1.default({ splitter: {} }, "content", (name, value) => JSON.parse(value), (name, value) => JSON.stringify(value));
    const _getSplitterVal = id => {
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
        createNew(id, key, data) {
            if (this.active) {
                this.active.hideElement();
            }
            this.active = this.createElement(id, key, data)
                .hideElement()
                .attr("id", id)
                .dataAttr("key", key)
                .dataAttr("data", data)
                .addClass("content")
                .appendElementTo(this.container);
        }
        activate(id) {
            const e = this.container.find("#" + id);
            if (!e.length) {
                return;
            }
            if (this.active) {
                this.active.hideElement();
            }
            this.active = e.showElement();
        }
        createElement(id, key, data) {
            if (key == api_1.Keys.SCRIPTS) {
                const element = String.html `
                <div>
                    <div class="editor">${data.name}</div>
                    <div></div><!-- main splitter vertical -->
                    <div class="grid"></div><!-- main panel -->
                </div>`
                    .toElement()
                    .addClass("split-content")
                    .css("grid-template-rows", `auto 5px ${_getSplitterVal(id).height}px`);
                new splitter_1.HorizontalSplitter({
                    element: element.children[1],
                    container: element,
                    resizeIndex: 2,
                    maxDelta: 100,
                    min: 25,
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
            return String.html `
            <div>
                ${key.toString()}:  ${data.name}
            </div>`
                .toElement();
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=content.js.map