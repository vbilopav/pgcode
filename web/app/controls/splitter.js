define(["require", "exports", "app/_sys/storage"], function (require, exports, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Splitter {
        constructor({ name, element, container, dockPosition = 0, resizeIdx, autoIdx, maxDelta = 250, min = 150, events = { docked: (() => { }), undocked: (() => { }), changed: (() => { }) } }) {
            this.element = element || (() => { throw new Error("element is required"); })();
            this.container = container || (() => { throw new Error("container is required"); })();
            this.cursor = document.body.css("cursor");
            this.dockPosition = dockPosition;
            this.events = events;
            this.storage = (name ? new storage_1.default({ position: null }, name) : { position: null });
            this.offset = null;
            this.docked = false;
            this.resizeIdx = resizeIdx || (() => { throw new Error("resizeIdx is required"); })();
            this.autoIdx = autoIdx || (() => { throw new Error("autoIdx is required"); })();
            this.maxDelta = maxDelta;
            this.min = min;
        }
        start() {
            this.element.on("mousedown", (e) => {
                this.offset = this.calculateOffset(e);
                document.body.css("cursor", this.element.css("cursor"));
            });
            document
                .on("mouseup", () => {
                if (this.offset === null) {
                    return true;
                }
                this.offset = null;
                document.body.css("cursor", this.cursor);
                if (this.docked) {
                    return true;
                }
                const [_, prev] = this.setNewPositionAndGetValues();
                this.storage.position = prev;
            })
                .on("mousemove", (e) => {
                if (this.offset === null) {
                    return true;
                }
                e.preventDefault();
                e.stopPropagation();
                const pos = this.getPositionFromMouseEvent(e);
                const calc = this.calculatePosition(pos, e);
                const [values, prev] = this.setNewPositionAndGetValues(calc + "px");
                const rect = this.container.getBoundingClientRect();
                if (this.calculateDelta(rect, pos) <= this.maxDelta) {
                    return false;
                }
                if (this.getMin(pos, calc) <= this.min) {
                    if (!this.docked) {
                        this.dock();
                        return false;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    if (this.docked) {
                        this.undock(false, this.min);
                        return false;
                    }
                }
                this.container.css(this.gridTemplateName, values.join(" "));
                this.events.changed();
                return false;
            });
            return this;
        }
        get isDocked() {
            return this.docked;
        }
        dock(skipEventEmit = false) {
            const [values, prev] = this.setNewPositionAndGetValues(this.dockPosition + "px");
            this.storage.position = prev;
            this.container.css(this.gridTemplateName, values.join(" "));
            this.docked = true;
            if (skipEventEmit) {
                return;
            }
            this.events.docked();
        }
        adjust() {
            if (this.storage.position) {
                let [values, _] = this.setNewPositionAndGetValues(this.storage.position + "px");
                this.container.css(this.gridTemplateName, values.join(" "));
            }
        }
        getCurrent() {
            return Number(this.getValues()[this.resizeIdx].replace("px", ""));
        }
        getPositionFromMouseEvent(e) {
            return e[this.mouseEventPositionProperty];
        }
        undock(skipEventEmit = false, pos = this.maxDelta) {
            if (!this.docked) {
                return;
            }
            if (pos === undefined) {
                pos = this.storage.position;
            }
            if (this.storage.position >= pos) {
                pos = this.storage.position;
            }
            const [values, _] = this.setNewPositionAndGetValues(pos + "px");
            this.container.css(this.gridTemplateName, values.join(" "));
            this.docked = false;
            if (skipEventEmit) {
                return;
            }
            this.events.undocked();
        }
        getValues() {
            return this.container.css(this.gridTemplateName).split(" ");
        }
        setNewPositionAndGetValues(newPosition) {
            const values = this.getValues();
            const prev = Number(values[this.resizeIdx].replace("px", ""));
            if (newPosition) {
                values[this.resizeIdx] = newPosition;
                values[this.autoIdx] = "auto";
            }
            return [values, prev];
        }
    }
    class VerticalSplitter extends Splitter {
        constructor(args) {
            super(args);
            this.element.addClass("main-split-v");
            this.mouseEventPositionProperty = "clientX";
            this.gridTemplateName = "grid-template-columns";
            this.adjust();
        }
        calculatePosition(currentPos, e) {
            return currentPos + this.offset;
        }
        calculateOffset(e) {
            const value = this.getCurrent();
            return value - this.getPositionFromMouseEvent(e);
        }
        calculateDelta(rect, currentPos) {
            return rect.width - currentPos;
        }
        getMin(currentPos, calculatedPos) {
            return currentPos;
        }
    }
    exports.VerticalSplitter = VerticalSplitter;
    ;
    class HorizontalSplitter extends Splitter {
        constructor(args) {
            super(args);
            this.element.addClass("main-split-h");
            this.mouseEventPositionProperty = "clientY";
            this.gridTemplateName = "grid-template-rows";
            this.adjust();
        }
        calculatePosition(currentPos, e) {
            return this.offset[1] + (this.offset[0] - this.getPositionFromMouseEvent(e));
        }
        calculateDelta(rect, currentPos) {
            return currentPos;
        }
        calculateOffset(e) {
            return [this.getPositionFromMouseEvent(e), this.getCurrent()];
        }
        getMin(currentPos, calculatedPos) {
            return calculatedPos;
        }
    }
    exports.HorizontalSplitter = HorizontalSplitter;
    ;
});
//# sourceMappingURL=Splitter.js.map