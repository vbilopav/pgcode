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
    private storage: Storage = new ProtectedLocalStorage();
    private namespace: string;
    private conversion: (name: string, value: string) => any;
    private names: Array<string> = new Array<string>();

    constructor(
        model: Object, 
        namespace = "", 
        conversion: (name: string, value: string) => any = (name, value) => value,
        storage: Storage = new ProtectedLocalStorage()) {
            this.storage = storage;
            this.namespace = namespace;
            this.conversion = conversion;
            for(let [name, defaultValue] of Object.entries(model)) {
                this.create(name, defaultValue);
            }
    }

    private create(name: string, defaultValue: any) {
        let fullName = this.getName(name);
        Object.defineProperty(this, name, {
            get: () => {
                const value = this.storage.getItem(fullName);
                if (value === null && defaultValue !== undefined) {
                    return defaultValue;
                }
                return this.conversion(name, value);
            },
            set: value => {
                if (value === null) {
                    this.storage.removeItem(fullName);
                } else {
                    this.storage.setItem(fullName, value);
                }
            }
        });
        this.names.push(name);
        return this;
    }

    private getName(name: string) : string {
        if (this.namespace) {
            return `${defaultNs}.${this.namespace}.${name}`;
        } else {
            return `${defaultNs}.${name}`;
        }
    }
}
