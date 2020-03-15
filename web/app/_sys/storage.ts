const defaultNs = "pgcode";

class ProtectedLocalStorage implements Storage {
    private dict = {} as {[name: string] : string; };
    private storage = localStorage;

    length: number;

    clear(): void {
        throw new Error("Method not implemented.");
    }

    key(index: number): string {
        throw new Error("Method not implemented.");
    }

    [name: string]: any;

    public getItem(name: string) : string {
        let value = this.dict[name];
        if (value === undefined) {
            value = this.storage.getItem(name);
            if (value === null) {
                return null;
            }
            this.dict[name] = value;
        }
        return value;
    }

    public setItem(name: string, value: string) : void {
        this.storage.setItem(name, value);
        this.dict[name] = value;
    }
    
    public removeItem(name: string) : void {
        this.storage.removeItem(name);
        delete this.dict[name];
    }
}

export default class {
    private _storage: Storage = new ProtectedLocalStorage();
    private _namespace: string;
    private _get: (name: string, value: string) => any;
    private _set: (name: string, value: any) => string;
    private _names: Array<string> = new Array<string>();

    constructor(
        model: Object, 
        namespace = "", 
        get: (name: string, value: string) => any = (name, value) => value,
        set: (name: string, value: any) => string = (name, value) => value,
        storage: Storage = new ProtectedLocalStorage()) {
            this._storage = storage;
            this._namespace = namespace;
            this._get = get;
            this._set = set;
            for(let [name, defaultValue] of Object.entries(model)) {
                this.create(name, defaultValue);
            }
    }

    public get storageKeys(): Array<string> {
        return this._names;
    }

    private create(name: string, defaultValue: any) {
        let fullName = this.getName(name);
        Object.defineProperty(this, name, {
            get: () => {
                const value = this._storage.getItem(fullName);
                if (value === null && defaultValue !== undefined) {
                    return defaultValue;
                }
                return this._get(name, value);
            },
            set: value => {
                if (value === null) {
                    this._storage.removeItem(fullName);
                } else {
                    this._storage.setItem(fullName, this._set(name, value));
                }
            }
        });
        this._names.push(name);
        return this;
    }

    private getName(name: string) : string {
        if (this._namespace) {
            return `${defaultNs}.${this._namespace}.${name}`;
        } else {
            return `${defaultNs}.${name}`;
        }
    }
}
