declare class ElementResult extends Element { length: number }

/**
 * Set of JQuery-like extensions on Element prototype.
 */
interface Element {
    /**
     * - Adds CSS class to instance.
     * - Returns same instance.
     */
    addClass(className: string): Element
    /**
     * - Appends child element to instance.
     * - Returns same instance.
     */
    appendElement(e: Element): Element
    /**
     * - Appends append instance as child element to node.
     * - Returns same instance.
     */
    appendElementTo(e: Element): Element
    /**
     * - If `key` is only parameter, returns value of instance attribute with same key (does not apply to `NodeList` and `HTMLModelArray`).
     * - If `value` is present, sets value to instance attribute with same key and returns same instance.
     * - If `toggle` is present, toggles presence of attribute with same key and returns same instance.
     */
    attr(key: string, value: string , toggle: boolean): String | Element
    attr(key: string, value: string): Element
    attr(key: string): String
    /**
     * returns value of instance css property (does not apply to `NodeList` and `HTMLModelArray`).
     */
    css(property: string): String
    /**
     * sets instance css property to value and returns same instance.
     */
    css(property: string, value: string): Element
    /**
     * - If `key` is only parameter, returns value of instance of data attribute (does not apply to `NodeList` and `HTMLModelArray`).
     * - If `value` is present, sets instance css property to that value and returns same instance.
     * - Note: setting value doesn't mutate the DOM, it caches value on element instance.
     */
    dataAttr(key: string, value?: any): any | Element
    /**
     * - Returns all element descendants of node that match selectors (executes `instance.querySelector`).
     * - If no matches found for selector - returns dummy parameter with result length property set to 0 (to avoid unnecessary nestings in code)
     */
    find(search: string): ElementResult;
    /**
     * - Returns all element descendants of node that match selectors (executes `instance.querySelectorAll`).
     */
    findAll(search: string): NodeList
    /**
     * - Iterates recursively trough child elements tree and execute `callback` for each element.
     * - `callFirst` - if true, skips root, default is false
     */
    forEachChild(callback: (e: Element)=>void, callFirst?: boolean): Element
    /**
     * 
     */
    hasClass(className: string): boolean
    /**
     * Sets display to none and returns same instance.
     */
    hideElement(): Element
    /**
     * Sets innerHTML value of element or elements and returns same instance.
     */
    html(content?: string): Element
    /**
     * Removes event listeners from element or elements (calls `removeEventListener`) and returns same instance.
     */
    off(type: string, listener: EventListenerOrEventListenerObject): Element
    /**
     * Adds event listeners to element or elements (calls `addEventListener`) and returns same instance.
     */
    on(type: string, listener: EventListenerOrEventListenerObject): Element
    /**
     * Checks element overflown state horizontally.
     */
    overflownX(): boolean
    /**
     * Checks element overflown state vertically.
     */
    overflownY(): boolean
    /**
     * Removes attribute by key and returns same instance.
     */
    removeAttr(key: string): Element
    /**
     * Removes attribute by key and returns same instance.
     */
    removeClass(className: string): Element
    /**
     * Sets focus to element instance and returns same instance.
     */
    setFocus(): Element
    /**
     * - If state parameter is not present sets display css attribute to empty (inherit) and returns same instance.
     * - If state parameter not present toggles display css attribute none or empty and returns same instance.
     */
    showElement(state?: boolean): Element
    /**
     * Toggles class with className (adds or removes if present) and returns same instance.
     */
    toggleClass(className: string, state?: boolean): Element
    /**
     * Dispatches a synthetic event to target (calls dispatchEvent) and returns same instance.
     */
    trigger(eventName: string): Element
    /**
     * If state is not present, adds visibility: visible attribute, otherwise toggles between visible and hidden and returns same instance.
     */
    visible(state?: boolean): Element
}
/**
 * Set of JQuery-like extensions on NodeList prototype.
 */
interface NodeList {
    /**
     * - Adds CSS class to instance.
     * - Returns same instance.
     */
    addClass(className: string): NodeList
    /**
     * - Appends child element to instance.
     * - Returns same instance.
     */
    appendElement(e: Element): NodeList
    /*
    * - Appends append instance as child element to node.
    * - Returns same instance.
    */
    appendElementTo(e: Element): NodeList
    /**
     * - If `key` is only parameter, returns value of instance attribute with same key (does not apply to `NodeList` and `HTMLModelArray`).
     * - If `value` is present, sets value to instance attribute with same key and returns same instance.
     * - If `toggle` is present, toggles presence of attribute with same key and returns same instance.
     */
    attr(key: string, value?: string , toggle?: boolean): String | NodeList
    /*
     * - If `property` is only parameter, returns value of instance css property (does not apply to `NodeList` and `HTMLModelArray`).
     * - If `value` is present, sets instance css property to that value and returns same instance.
     */
    css(property: string, value?: string): String | NodeList
    /**
     * - If `key` is only parameter, returns value of instance of data attribute (does not apply to `NodeList` and `HTMLModelArray`).
     * - If `value` is present, sets instance css property to that value and returns same instance.
     * - Note: setting value doesn't mutate the DOM, it caches value on element instance.
     */
    dataAttr(key: string, value?: string): any | NodeList
    /**
     * - Iterates recursively trough child elements tree and execute `callback` for each element.
     * - `callFirst` - if true, skips root, default is false
     */
    forEachChild(callback: (e: Element)=>void, callFirst?: boolean): NodeList
    /**
     * Sets innerHTML value of element or elements and returns same instance.
     */
    html(content?: string): NodeList
    /**
     * Removes event listeners from element or elements (calls `removeEventListener`) and returns same instance.
     */
    off(type: string, listener: EventListenerOrEventListenerObject): NodeList
    /**
     * Adds event listeners to element or elements (calls `addEventListener`) and returns same instance.
     */
    on(type: string, listener: EventListenerOrEventListenerObject): Element
    /**
     * Removes attribute by key and returns same instance.
     */
    removeAttr(key: string): NodeList
    /**
     * Removes attribute by key and returns same instance.
     */
    removeClass(className: string): NodeList
    /**
     * - Toggles class with className (adds or removes if present) and returns same instance.
     */
    toggleClass(className: string, state?: boolean): NodeList
    /**
     * - Check if element has class with `className`.
     */
    hasClass(className: string): NodeList
    /**
     * - If state parameter is not present sets display css attribute to empty (inherit) and returns same instance.
     * - If state parameter not present toggles display css attribute none or empty and returns same instance.
     */
    showElement(state?: boolean): NodeList
    /**
     * Sets display to none and returns same instance.
     */
    hideElement(): NodeList
    /**
     * Dispatches a synthetic event to target (calls `dispatchEvent`) and returns same instance.
     */
    trigger(eventName: string): Document
    /**
     * If state is not present, adds visibility: visible attribute, otherwise toggles between visible and hidden and returns same instance.
     */
    visible(state?: boolean): NodeList
}
interface HTMLCollection {
    /**
     * - Adds CSS class to instance.
     * - Returns same instance.
     */
    addClass(className: string): HTMLCollection
    /**
     * - Appends child element to instance.
     * - Returns same instance.
     */
    appendElement(e: Element): HTMLCollection
    /*
    * - Appends append instance as child element to node.
    * - Returns same instance.
    */
    appendElementTo(e: Element): HTMLCollection
    /**
     * - If `key` is only parameter, returns value of instance attribute with same key (does not apply to `NodeList` and `HTMLModelArray`).
     * - If `value` is present, sets value to instance attribute with same key and returns same instance.
     * - If `toggle` is present, toggles presence of attribute with same key and returns same instance.
     */
    attr(key: string, value?: string , toggle?: boolean): String | HTMLCollection
    /*
     * - If `property` is only parameter, returns value of instance css property (does not apply to `NodeList` and `HTMLModelArray`).
     * - If `value` is present, sets instance css property to that value and returns same instance.
     */
    css(property: string, value?: string): String | HTMLCollection
    /**
     * - If `key` is only parameter, returns value of instance of data attribute (does not apply to `NodeList` and `HTMLModelArray`).
     * - If `value` is present, sets instance css property to that value and returns same instance.
     * - Note: setting value doesn't mutate the DOM, it caches value on element instance.
     */
    dataAttr(key: string, value?: string): any | HTMLCollection
    /**
     * - Iterates recursively trough child elements tree and execute `callback` for each element.
     * - `callFirst` - if true, skips root, default is false
     */
    forEachChild(callback: (e: Element)=>void, callFirst?: boolean): HTMLCollection
    /**
     * Sets innerHTML value of element or elements and returns same instance.
     */
    html(content?: string): HTMLCollection
    /**
     * Removes event listeners from element or elements (calls `removeEventListener`) and returns same instance.
     */
    off(type: string, listener: EventListenerOrEventListenerObject): HTMLCollection
    /**
     * Adds event listeners to element or elements (calls `addEventListener`) and returns same instance.
     */
    on(type: string, listener: EventListenerOrEventListenerObject): HTMLCollection
    /**
     * Removes attribute by key and returns same instance.
     */
    removeAttr(key: string): HTMLCollection
    /**
     * Removes attribute by key and returns same instance.
     */
    removeClass(className: string): HTMLCollection
    /**
     * - Toggles class with className (adds or removes if present) and returns same instance.
     */
    toggleClass(className: string, state?: boolean): HTMLCollection
    /**
     * - Check if element has class with `className`.
     */
    hasClass(className: string): HTMLCollection
    /**
     * - If state parameter is not present sets display css attribute to empty (inherit) and returns same instance.
     * - If state parameter not present toggles display css attribute none or empty and returns same instance.
     */
    showElement(state?: boolean): HTMLCollection
    /**
     * Sets display to none and returns same instance.
     */
    hideElement(): HTMLCollection
    /**
     * Dispatches a synthetic event to target (calls `dispatchEvent`) and returns same instance.
     */
    trigger(eventName: string): Document
    /**
     * If state is not present, adds visibility: visible attribute, otherwise toggles between visible and hidden and returns same instance.
     */
    visible(state?: boolean): HTMLCollection
}
/**
 * Set of JQuery-like extensions on NodeList prototype.
 */
interface Document {
    /**
     * Adds event listeners to element or elements (calls `addEventListener`) and returns same instance.
     */
    on(type: string, listener: EventListenerOrEventListenerObject): Document
    /**
     * Removes event listeners from element or elements (calls `removeEventListener`) and returns same instance.
     */
    off(type: string, listener: EventListenerOrEventListenerObject): Document
    /**
     * Dispatches a synthetic event to target (calls `dispatchEvent`) and returns same instance.
     */
    trigger(eventName: string): Document
    /**
     * - Returns all element descendants of node that match selectors (executes `instance.querySelector`).
     * - If no matches found for selector - returns dummy parameter with result length property set to 0 (to avoid unnecessary nestings in code)
     */
    find(search: string): ElementResult
    /**
     * - Returns all element descendants of node that match selectors (executes `instance.querySelectorAll`).
     */
    findAll(search: string): NodeList
}
/**
 * Set of JQuery-like extensions on NodeList prototype.
 */
interface Window {
    /**
     * Adds event listeners to element or elements (calls `addEventListener`) and returns same instance.
     */
    on(type: string, listener: EventListenerOrEventListenerObject): Window
    /**
     * 
     */
    off(eventName: string, eventHandler: (e: Event)=>void): Window
    /**
     * Dispatches a synthetic event to target (calls dispatchEvent) and returns same instance.
     */
    trigger(eventName: string): Window
    /**
     * Global application object
     */
}
/**
 * 
 */

interface StringConstructor {
    /**
     * Support for Visual Studio Code [`lit-html` extension](https://github.com/Polymer/lit-html)
     * 
     * *Syntax highlighting and IntelliSense for html inside of JavaScript and TypeScript tagged template strings.*
     * 
     * ---
     * 
     * Example: `String.html``<div>some html</div>``
     * 
     * Returns unchanged string value.
     */
    html: any
}

/**
 * 
 */
interface String {
    /**
     * Returns hash code of string instance
     */
    hashCode(): number
    /**
     * Converts kebab name in a string to camel cased name
     */
    toCamelCase(): string
    /**
     * Creates element from tag name in a String and adds id and content if those params are present.
     */
    createElement(id?: string, content?: string): Element
    /**
     * Builds Element from HTML markup in a string
     */
    toElement(): Element,

    formatDateString(): string;
}

interface Map<K, V> {
    first(): V
}
interface Map<K, V> {
    where(predicate: (v: V) => boolean): V
}
interface Map<K, V> {
    maxBy(predicate: (v: V) => any): V
}
