define(["require", "exports", "app/_sys/storage"], function (require, exports, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const defaultStorage = { position: null, docked: true };
    const createStorage = (name) => new storage_1.default(defaultStorage, name, (name, value) => name == "docked" ? JSON.parse(value) : value);
    class Splitter {
        constructor({ name, element, container, dockPosition = 0, resizeIndex, maxDelta = 250, min = 100, events = { docked: (() => { }), undocked: (() => { }), changed: (() => { }) }, maxResizeDelta, storage }) {
            this.element = element || (() => { throw new Error("element is required"); })();
            this.container = container || (() => { throw new Error("container is required"); })();
            this.cursor = document.body.css("cursor");
            this.dockPosition = dockPosition;
            this.events = events;
            this.storage = storage ? storage : (name ? createStorage(name) : defaultStorage);
            this.offset = null;
            this.docked = false;
            this.resizeIndex = resizeIndex !== undefined ? resizeIndex : (() => { throw new Error("resizeIndex is required"); })();
            this.maxDelta = maxDelta;
            this.min = min;
            this.maxResizeDelta = maxResizeDelta;
        }
        updateIndexesAndAdjust(resizeIndex) {
            if (resizeIndex !== undefined) {
                this.resizeIndex = resizeIndex;
            }
            this.autoIndex = this.container.css(this.gridTemplateName).split(" ").indexOf("auto");
            this.adjust();
        }
        start() {
            this.element
                .on("mousedown", (e) => {
                this.offset = this.calculateOffset(e);
                document.body.css("cursor", this.element.css("cursor"));
                this.element.addClass("split-moving");
                let v = this.getValuesOrSetNewPos(this.storage.position + "px");
                this.startingPosition = v.previousPosition;
            })
                .on("mouseup", () => {
                this.element.removeClass("split-moving");
                this.startingPosition = null;
            })
                .on("dblclick", () => {
                if (this.isDocked) {
                    this.undockInternal();
                }
                else {
                    this.dock();
                }
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
                const v = this.getValuesOrSetNewPos();
                this.storage.position = v.previousPosition;
                this.element.removeClass("split-moving");
            })
                .on("mousemove", (e) => {
                if (this.offset === null) {
                    return true;
                }
                e.preventDefault();
                e.stopPropagation();
                const pos = this.getPositionFromMouseEvent(e);
                const calc = this.calculatePosition(pos, e);
                const v = this.getValuesOrSetNewPos(calc + "px");
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
                        this.undockInternal(false, this.min);
                        return false;
                    }
                }
                this.element.addClass("split-moving");
                this.container.css(this.gridTemplateName, v.values.join(" "));
                this.events.changed();
                return false;
            });
            return this;
        }
        get isDocked() {
            return this.docked;
        }
        dock(skipEventEmit = false) {
            const v = this.getValuesOrSetNewPos(this.dockPosition + "px");
            this.storage.position = this.startingPosition ? this.startingPosition : v.previousPosition;
            this.container.css(this.gridTemplateName, v.values.join(" "));
            this.docked = true;
            this.storage.docked = true;
            this.element.removeClass("split-moving");
            if (skipEventEmit) {
                return;
            }
            this.events.docked();
        }
        undock(skipEventEmit = false) {
            this.undockInternal(skipEventEmit, this.storage.position);
        }
        undockInternal(skipEventEmit = false, pos = this.maxDelta) {
            if (!this.docked) {
                return;
            }
            if (pos === undefined) {
                pos = this.storage.position;
            }
            if (this.storage.position >= pos) {
                pos = this.storage.position;
            }
            const v = this.getValuesOrSetNewPos(pos + "px");
            this.container.css(this.gridTemplateName, v.values.join(" "));
            this.docked = false;
            this.storage.docked = false;
            if (skipEventEmit) {
                return;
            }
            this.events.undocked();
        }
        move(delta, values) {
            values = values || this.getValuesOrSetNewPos();
            if (values.previousPosition <= this.min) {
                return false;
            }
            const p = values.previousPosition + delta;
            this.storage.position = p;
            values.values[this.resizeIndex] = p + "px";
            this.container.css(this.gridTemplateName, values.values.join(" "));
        }
        adjust() {
            if (this.storage.docked) {
                this.dock();
            }
            else {
                if (this.storage.position) {
                    let v = this.getValuesOrSetNewPos(this.storage.position + "px");
                    this.container.css(this.gridTemplateName, v.values.join(" "));
                }
            }
        }
        getCurrent() {
            return Number(this.getValues()[this.resizeIndex].replace("px", ""));
        }
        getPositionFromMouseEvent(e) {
            return e[this.mouseEventPositionProperty];
        }
        getValuesOrSetNewPos(newPosition) {
            const values = this.getValues();
            const previousPosition = Number(values[this.resizeIndex].replace("px", ""));
            if (newPosition) {
                values[this.resizeIndex] = newPosition;
                values[this.autoIndex] = "auto";
            }
            return { values, previousPosition };
        }
        getValues() {
            return this.container.css(this.gridTemplateName).split(" ");
        }
    }
    exports.Splitter = Splitter;
    class VerticalSplitter extends Splitter {
        constructor(args) {
            super(args);
            this.element.addClass("main-split").addClass("main-split-v");
            this.mouseEventPositionProperty = "clientX";
            this.gridTemplateName = "grid-template-columns";
            this.updateIndexesAndAdjust();
        }
        start() {
            super.start();
            if (this.maxResizeDelta) {
                let last = window.innerWidth;
                window.on("resize", () => {
                    if (this.isDocked) {
                        return;
                    }
                    let v = this.getValuesOrSetNewPos(), w = window.innerWidth, delta = w - last;
                    last = w;
                    if (w - v.previousPosition < this.maxResizeDelta) {
                        this.move(delta, v);
                    }
                });
            }
            return this;
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
            this.element.addClass("main-split").addClass("main-split-h");
            this.mouseEventPositionProperty = "clientY";
            this.gridTemplateName = "grid-template-rows";
            this.updateIndexesAndAdjust();
        }
        start() {
            super.start();
            return this;
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
//# sourceMappingURL=splitter.js.map