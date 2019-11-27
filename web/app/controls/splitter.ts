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
    events: SplitterEvents
}

interface IStorage {
    position: number
}

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

    protected mouseEventPositionProperty: string; //_prop
    protected gridTemplateName: string; //css

    protected abstract calculateOffset(e: MouseEvent): number | [number, number]; //._calcOffset(e)
    protected abstract calculatePosition(currentPos: number, e: MouseEvent): number; // _calcPos(pos, e)
    protected abstract calculateDelta(rect: DOMRect, currentPos: number): number; //_calcDelta(rect, pos) 
    protected abstract getMin(currentPos: number, calculatedPos: number): number; //_getMin(pos, calc)

    constructor({
        name,
        element,
        container,
        dockPosition = 0,
        resizeIdx,
        autoIdx,
        maxDelta = 250, 
        min = 150,
        events = { docked: (()=>{}), undocked: (()=>{}), changed: (()=>{}) }
    }: SplitterCtorArgs) {
        this.element = element || (() => {throw new Error("element is required")})();
        this.container = container || (() => {throw new Error("container is required")})();
        this.cursor = document.body.css("cursor") as string;
        this.dockPosition = dockPosition;
        this.events = events;
        //this.events.changed = this.events.changed || (()=>{});
        this.storage = (name ? new Storage({position: null}, name) : {position: null}) as any as IStorage;

        this.offset = null;
        this.docked = false;
        this.resizeIdx = resizeIdx || (() => {throw new Error("resizeIdx is required")})();
        this.autoIdx = autoIdx || (() => {throw new Error("autoIdx is required")})();
        this.maxDelta = maxDelta;
        this.min = min;
    }

    start() {

        this.element.on("mousedown", (e: MouseEvent) => {
            this.offset = this.calculateOffset(e);
            document.body.css("cursor", this.element.css("cursor") as string);
            this.element.addClass("split-moving");
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
                const [values, prev] = this.setNewPositionAndGetValues(calc + "px");
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
                this.container.css(this.gridTemplateName, values.join(" "));
                this.events.changed();
                return false;
            });

        return this;
    }

    public get isDocked() {
        return this.docked;
    }
    
    private dock(skipEventEmit=false): void {
        const [values, prev] = this.setNewPositionAndGetValues(this.dockPosition + "px");
        this.storage.position = prev;
        this.container.css(this.gridTemplateName, values.join(" "));
        this.docked = true;
        this.element.removeClass("split-moving");
        if (skipEventEmit) {
            return
        }
        this.events.docked();
    }

    protected adjust() : void {
        if (this.storage.position) {
            let [values, _] = this.setNewPositionAndGetValues(this.storage.position + "px");
            this.container.css(this.gridTemplateName, values.join(" "));
        }
    }

    protected getCurrent(): number {
        return Number(this.getValues()[this.resizeIdx].replace("px", ""));
    }

    protected getPositionFromMouseEvent(e: MouseEvent) { //_getPos
        return e[this.mouseEventPositionProperty];
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
        const [values, _] = this.setNewPositionAndGetValues(pos + "px");
        this.container.css(this.gridTemplateName, values.join(" "));
        this.docked = false;
        if (skipEventEmit) {
            return
        }
        this.events.undocked();
    }

    private getValues(): string[] {
        return (this.container.css(this.gridTemplateName) as string).split(" ");
    }

    private setNewPositionAndGetValues(newPosition?: string): [string[], number] { //_getValuesArray
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
    constructor(args: SplitterCtorArgs) {
        super(args);
        this.element.addClass("main-split").addClass("main-split-v");
        this.mouseEventPositionProperty = "clientX";
        this.gridTemplateName = "grid-template-columns";
        this.adjust();
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