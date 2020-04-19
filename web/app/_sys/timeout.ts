const _keys: Record<string, number> = {};

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

export const timeoutAsync = (handler: Function, timeout: number, key: string) => {
    let t = _keys[key];
    if (t) {
        clearTimeout(t);
        _keys[key] = undefined;
    }
    _keys[key] = setTimeout(async () => {
        await handler();
        clearTimeout(_keys[key]);
        _keys[key] = undefined;
    }, timeout);
};