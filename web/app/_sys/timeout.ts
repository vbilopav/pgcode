const _keys: Record<string, number> = {};
const _promises: Record<string, Promise<void>> = {};

export const timeout = (handler: Function, timeout: number, key: string) => {
    let t = _keys[key];
    if (t) {
        clearTimeout(t);
        _keys[key] = undefined;
    }
    _keys[key] = setTimeout(() => {
        handler();
        clearTimeout(_keys[key]);
        _keys[key] = undefined;
    }, timeout);
};

export const timeoutAsync = async (handler: ()=>Promise<void>, timeout: number, key: string) => {
    let t = _keys[key];
    if (t) {
        clearTimeout(t);
        _keys[key] = undefined;
        _promises[key] && await _promises[key];
    }
    
    _keys[key] = setTimeout(async () => {
        const promise = handler();
        _promises[key] = promise;
        await promise;
        clearTimeout(_keys[key]);
        _keys[key] = undefined;
        _promises[key] = undefined;
    }, timeout);
};

export class Consumer {
    private shouldRun: boolean = false;
    private handler: () => Promise<void>;
    private timeout: number = 0;

    constructor(handler?: () => Promise<void>, timeout?: number) {
        if (handler) {
            this.handler = handler;
        }
        if (timeout) {
            this.timeout = timeout;
        }
        this.start();
    }

    run(handler?: () => Promise<void>) {
        if (handler) {
            this.handler = handler;
        }
        this.shouldRun = true;
    }

    stop() {
        this.shouldRun = false;
    }

    private start() {
        setTimeout(async () => {
            if (this.shouldRun) {
                this.shouldRun = false;
                await this.handler();
            }
            this.start();
        }, this.timeout);
    }
}