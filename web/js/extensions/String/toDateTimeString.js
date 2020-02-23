define(["js/extensions/test-proto"], (test) => {

    test(String, ["toDateTimeString"]);

    String.prototype.toDateTimeString = function() {
        const d = new Date(this);
        const today = new Date();
        if (d.getDate() == today.getDate() && d.getMonth() == today.getMonth() && d.getFullYear() == today.getFullYear()) {
            return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}.${d.getMilliseconds().toString().padStart(3, "0")}`
        } else {
            return `${d.getFullYear()}-${d.getMonth().toString().padStart(2, "0")}-${d.getDay().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}.${d.getMilliseconds().toString().padStart(3, "0")}`
        }
    }
});