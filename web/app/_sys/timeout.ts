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