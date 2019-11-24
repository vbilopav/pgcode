const _entries = {};

const subscribe: (name: string | Array<string>, handler: (...args: any[]) => void) => number | void = (name, handler) => {
    const doSub: (topic: string) => number = topic => {
        let entry = _entries[topic];
        if (!entry) {
            entry = entry[topic] = [];
        } 
        return _entries[topic].push(handler) - 1;
    };
    if (name instanceof Array) {
        for(let n of name) {
            doSub(n);
        }
    } else {
        return doSub(name);
    }
}

const publish: (name: string | Array<string>, ...args: any[]) => void = (name, ...args) => {
    const doPub: (topic: string) => void = topic => {
        const entry = _entries[topic];
        if (!entry) {
            return;
        }
        for(let callback of entry) {
            callback(args);
        }
    };
    if (name instanceof Array) {
        for(let n of name) {
            doPub(n);
        }
    } else {
        doPub(name);
    }
}

const unsubscribe: (name: string, ref: number) => boolean = (name, ref) => {
    let entry = _entries[name];
    if (!entry) {
        return false;;
    }
    entry.splice(ref, 1);
    return true;
}

export { 
    subscribe,
    publish,
    unsubscribe
};