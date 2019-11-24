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
        constructor(model, namespace = "", conversion = (name, value) => value, storage = new ProtectedLocalStorage()) {
            this.storage = new ProtectedLocalStorage();
            this.names = new Array();
            this.storage = storage;
            this.namespace = namespace;
            this.conversion = conversion;
            for (let [name, defaultValue] of Object.entries(model)) {
                this.create(name, defaultValue);
            }
        }
        create(name, defaultValue) {
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
                    }
                    else {
                        this.storage.setItem(fullName, value);
                    }
                }
            });
            this.names.push(name);
            return this;
        }
        getName(name) {
            if (this.namespace) {
                return `${defaultNs}.${this.namespace}.${name}`;
            }
            else {
                return `${defaultNs}.${name}`;
            }
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=storage.js.map