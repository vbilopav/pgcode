define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const defaultNs = "pgcode";
    class ProtectedLocalStorage {
        constructor() {
            this.dict = {};
            this.storage = localStorage;
        }
        clear() {
            throw new Error("Method not implemented.");
        }
        key(index) {
            throw new Error("Method not implemented.");
        }
        getItem(name) {
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
        setItem(name, value) {
            this.storage.setItem(name, value);
            this.dict[name] = value;
        }
        removeItem(name) {
            this.storage.removeItem(name);
            delete this.dict[name];
        }
    }
    class default_1 {
        constructor(model, namespace = "", get = (name, value) => value, set = (name, value) => value, storage = new ProtectedLocalStorage()) {
            this._storage = new ProtectedLocalStorage();
            this._names = new Array();
            this._storage = storage;
            this._namespace = namespace;
            this._get = get;
            this._set = set;
            for (let [name, defaultValue] of Object.entries(model)) {
                this.create(name, defaultValue);
            }
        }
        get storageKeys() {
            return this._names;
        }
        create(name, defaultValue) {
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
                    }
                    else {
                        this._storage.setItem(fullName, this._set(name, value));
                    }
                }
            });
            this._names.push(name);
            return this;
        }
        getName(name) {
            if (this._namespace) {
                return `${defaultNs}.${this._namespace}.${name}`;
            }
            else {
                return `${defaultNs}.${name}`;
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=storage.js.map