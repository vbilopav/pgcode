String.prototype.formatDateString = function() {
    const d = new Date(this);
    const today = new Date();
    const fullYear = d.getFullYear();
    const date = d.getDate();
    const month = d.getMonth();
    if (date == today.getDate() && month == today.getMonth() && fullYear == today.getFullYear()) {
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    } else {
        return `${fullYear}-${(month + 1).toString().padStart(2, "0")}-${date.toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    }
};

export default null;


Map.prototype.first = function<V>() {
    return this.values().next() as V;
}

Map.prototype.where = function*<V> (predicate: (v: V) => boolean) {
    for (let [key, value] of this) {
        if (predicate(value)) {
            yield value as V;
        }
    };
};

Map.prototype.maxBy = function<V> (predicate: (v: V) => any) {
    let result: V;
    let highest: V;
    for (let [key, value] of this) {
        if (result === undefined) {
            result = value;
            highest = predicate(value)
        } else {
            const current = predicate(value);
            if (current > highest) {
                result = value;
                highest = current;
            }
        }
    };
    return result;
};