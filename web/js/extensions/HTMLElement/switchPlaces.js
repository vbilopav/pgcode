define(["js/extensions/test-proto", "js/extensions/HTMLElement/css"], test => {

    test(HTMLElement, ["switchPlaces"]);

    HTMLElement.prototype.switchPlaces = function(target) {
        const parent = this.parentElement;
        let next = this.nextElementSibling;
        let targetNext = target.nextElementSibling;
        this.remove();
        if (next && next.id === target.id) {
            next = targetNext;
        } else if (targetNext && targetNext.id === this.id) {
            targetNext = next;
            targetNext ? parent.insertBefore(this, targetNext) : parent.append(this);
            next ? parent.insertBefore(target, next) : parent.append(target);
            return;
        }
        next ? parent.insertBefore(target, next) : parent.append(target);
        targetNext ? parent.insertBefore(this, targetNext) : parent.append(this);
        return this;
    }
});