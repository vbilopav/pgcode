const _keys: Record<string, number> = {};

export default (handler: Function, timeout: number, key: string) => {
    let t = _keys[key];
    if (t) {
        clearTimeout(t);
        _keys[key] = undefined;
    }
    _keys[key] = setTimeout(() => {
        clearTimeout(_keys[key]);
        _keys[key] = undefined;
        handler();
    }, timeout);
};