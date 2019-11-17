define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    const names = new Array();
    var defaultNs;
    class default_1 {
        constructor(model, namespace = "", conversion = {}, storage = new ProtectedLocalStorage()) {
            this.storage = new ProtectedLocalStorage();
            this.storage = storage;
            if (!defaultNs) {
                throw new Error("default namespace cannot be empty or null");
            }
            this.namespace = namespace;
            this.conversion = conversion;
            for (let [name, defaultValue] of Object.entries(model)) {
                this.create(name, defaultValue);
            }
        }
        static setDefaultNamespace(name) {
            defaultNs = name;
        }
        create(name, defaultValue) {
            let fullName = this.getName(name);
            if (names.indexOf(fullName) !== -1) {
                throw new Error(`Name "${fullName}" is already been defined!`);
            }
            names.push(fullName);
            Object.defineProperty(this, name, {
                get: () => {
                    const value = this.storage.getItem(fullName);
                    if (value === null && defaultValue !== undefined) {
                        return defaultValue;
                    }
                    const conversion = this.conversion[name];
                    if (conversion) {
                        return conversion(value);
                    }
                    return value;
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