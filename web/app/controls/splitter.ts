import Storage from "app/_sys/storage";

interface SplitterEvents {
    docked: ()=>void;
    undocked: ()=>void;
    changed: ()=>void
}

interface SplitterCtorArgs {
    name: string,
    element: HTMLElement,
    container: HTMLElement,
    dockPosition: number,
    resizeIdx: number,
    autoIdx: number,
    maxDelta: number, 
    min: number,
    events: SplitterEvents,
    maxResizeDelta?: number;
}

interface INewPositionResult {
    values: string[],
    previousPosition: number
}

interface IStorage {
    position: number,
    docked: boolean
}

const createStorage = () => new Storage(defaultStorage, name, (name, value) => name == "docked" ? JSON.parse(value) as boolean : value) as any as IStorage;
const defaultStorage: IStorage = {position: null, docked: false};

abstract class Splitter {
    private container: Element;
    private cursor: string;
    private dockPosition: number;
    private events: SplitterEvents;
    private storage: IStorage;
    private docked: boolean;
    private resizeIdx: number;
    private autoIdx: number;
    private maxDelta: number;
    private min: number;

    protected element: Element;
    protected offset: number | [number, number];
    protected maxResizeDelta?: number;

    protected mouseEventPositionProperty: string;
    protected gridTemplateName: string;

    protected abstract calculateOffset(e: MouseEvent): number | [number, number];
    protected abstract calculatePosition(currentPos: number, e: MouseEvent): number;
    protected abstract calculateDelta(rect: DOMRect, currentPos: number): number;
    protected abstract getMin(currentPos: number, calculatedPos: number): number;

    constructor({
        name,
        element,
        container,
        dockPosition = 0,
        resizeIdx,
        autoIdx,
        maxDelta = 250, 
        min = 150,
        events = { docked: (()=>{}), undocked: (()=>{}), changed: (()=>{}) },
        maxResizeDelta
    }: SplitterCtorArgs) {
        this.element = element || (() => {throw new Error("element is required")})();
        this.container = container || (() => {throw new Error("container is required")})();
        this.cursor = document.body.css("cursor") as string;
        this.dockPosition = dockPosition;
        this.events = events;
        this.storage = (name ? createStorage() : defaultStorage);
        this.offset = null;
        this.docked = false;
        this.resizeIdx = resizeIdx || (() => {throw new Error("resizeIdx is required")})();
        this.autoIdx = autoIdx || (() => {throw new Error("autoIdx is required")})();
        this.maxDelta = maxDelta;
        this.min = min;
        this.maxResizeDelta = maxResizeDelta;
    }

    public start(): void {

        this.element
            .on("mousedown", (e: MouseEvent) => {
                this.offset = this.calculateOffset(e);
                document.body.css("cursor", this.element.css("cursor") as string);
                this.element.addClass("split-moving");
            })
            .on("mouseup", () => {
                this.element.removeClass("split-moving");
            })
            .on("dblclick", () => {
                if (this.isDocked) {
                    this.undock();
                } else {
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
            .on("mousemove", (e: MouseEvent) => {
                if (this.offset === null) {
                    return true;
                }
                e.preventDefault();
                e.stopPropagation();
    
                const pos = this.getPositionFromMouseEvent(e);
                const calc = this.calculatePosition(pos, e);
                const v = this.getValuesOrSetNewPos(calc + "px");
                const rect = this.container.getBoundingClientRect() as DOMRect;

                if (this.calculateDelta(rect, pos) <= this.maxDelta) {
                    return false;
                }

                if (this.getMin(pos, calc) <= this.min) {
                    if (!this.docked) {
                        this.dock();
                        return false;
                    } else {
                        return false;
                    }
                } else {
                    if (this.docked) {
                        this.undock(false, this.min);
                        return false;
                    }
                }
                this.element.addClass("split-moving");
                this.container.css(this.gridTemplateName, v.values.join(" "));
                this.events.changed();
                return false;
            });
    }

    public get isDocked() {
        return this.docked;
    }

    public move(delta: number, values: INewPositionResult) {
        values = values || this.getValuesOrSetNewPos();
        if (values.previousPosition <= this.min) {
            return false;
        }
        const p = values.previousPosition + delta;
        this.storage.position = p;
        values.values[this.resizeIdx] = p + "px";
        this.container.css(this.gridTemplateName, values.values.join(" "));
    }

    protected adjust() : void {
        if (this.storage.docked) {
            this.dock();
        } else {
            if (this.storage.position) {
                let v = this.getValuesOrSetNewPos(this.storage.position + "px");
                this.container.css(this.gridTemplateName, v.values.join(" "));
            }
        }
    }

    protected getCurrent(): number {
        return Number(this.getValues()[this.resizeIdx].replace("px", ""));
    }

    protected getPositionFromMouseEvent(e: MouseEvent) {
        return e[this.mouseEventPositionProperty];
    }

    protected getValuesOrSetNewPos(newPosition?: string): INewPositionResult {
        const values = this.getValues();
        const previousPosition = Number(values[this.resizeIdx].replace("px", ""));
        if (newPosition) {
            values[this.resizeIdx] = newPosition;
            values[this.autoIdx] = "auto";
        }
        return {values, previousPosition};
    }

    private dock(skipEventEmit=false): void {
        const v = this.getValuesOrSetNewPos(this.dockPosition + "px");
        this.storage.position = v.previousPosition;
        this.container.css(this.gridTemplateName, v.values.join(" "));
        this.docked = true;
        this.storage.docked = true;
        this.element.removeClass("split-moving");
        
        if (skipEventEmit) {
            return
        }
        this.events.docked();
    }

    private undock(skipEventEmit=false, pos=this.maxDelta): void {
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
            return
        }
        this.events.undocked();
    }

    private getValues(): string[] {
        return (this.container.css(this.gridTemplateName) as string).split(" ");
    }
}

class VerticalSplitter extends Splitter {
    constructor(args: SplitterCtorArgs) {
        super(args);
        this.element.addClass("main-split").addClass("main-split-v");
        this.mouseEventPositionProperty = "clientX";
        this.gridTemplateName = "grid-template-columns";
        this.adjust();
    }

    public start(): void {
        super.start();
        if (this.maxResizeDelta) {
            let last = window.innerWidth;
            window.on("resize", () => {
                if (this.isDocked) {
                    return;
                }
                let v = this.getValuesOrSetNewPos(),
                    w = window.innerWidth,
                    delta = w - last;
                    last = w;
                if (w - v.previousPosition < this.maxResizeDelta) {
                    this.move(delta, v);
                }
            });
        }
    }

    protected calculatePosition(currentPos: number, e: MouseEvent): number {
        return currentPos + (this.offset as number);
    }

    protected calculateOffset(e: MouseEvent): number {
        const value = this.getCurrent();
        return value - this.getPositionFromMouseEvent(e);
    } 

    protected calculateDelta(rect: DOMRect, currentPos: number): number {
        return rect.width - currentPos;
    }

    protected getMin(currentPos: number, calculatedPos: number): number {
        return currentPos;
    }
};

class HorizontalSplitter extends Splitter {
    constructor(args: SplitterCtorArgs) {
        super(args);
        this.element.addClass("main-split").addClass("main-split-h");
        this.mouseEventPositionProperty = "clientY";
        this.gridTemplateName = "grid-template-rows";
        this.adjust();
    }

    public start(): void {
        super.start();
        // ...
    }

    protected calculatePosition(currentPos: number, e: MouseEvent): number {
        return this.offset[1] + (this.offset[0] - this.getPositionFromMouseEvent(e));
    }

    protected calculateDelta(rect: DOMRect, currentPos: number): number {
        return currentPos;
    }

    protected calculateOffset(e: MouseEvent): [number, number] {
        return [this.getPositionFromMouseEvent(e), this.getCurrent()];
    } 

    protected getMin(currentPos: number, calculatedPos: number): number {
        return calculatedPos;
    }
};


export {VerticalSplitter, HorizontalSplitter, SplitterCtorArgs};