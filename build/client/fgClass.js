"use strict";
var eventEmitter_1 = require('../eventEmitter');
var globalEvents = require('./globalEvents');
var fgInstanceModule = require('./fgInstance');
exports.fgClassTable = [];
exports.fgClassDict = {};
;
var FgClass = (function () {
    function FgClass(opts) {
        this.id = exports.fgClassTable.length;
        this.instances = [];
        this.tpl = opts.tpl;
        this.name = opts.name;
        this.eventEmitter = new eventEmitter_1.default();
        exports.fgClassDict[opts.name] = this;
        exports.fgClassTable.push(this);
        function FgInstance() {
            fgInstanceModule.FgInstanceBase.apply(this, arguments);
        }
        ;
        this.createFn = FgInstance;
        this.createFn.constructor = fgInstanceModule.FgInstanceBase;
        this.createFn.prototype = Object.create(fgInstanceModule.FgInstanceBase.prototype);
        var classFn = opts.classFn;
        if (classFn) {
            classFn(this, this.createFn.prototype);
        }
        ;
    }
    ;
    FgClass.prototype.on = function (name, selector, fn) {
        if (arguments.length === 2) {
            name = name;
            fn = arguments[1];
            selector = null;
        }
        else {
            var originalFn = fn;
            fn = function (event) {
                if (match(this, event.target, selector)) {
                    originalFn.call(this, event);
                }
                ;
            };
        }
        ;
        globalEvents.listen(name);
        this.eventEmitter.on(name, fn);
    };
    ;
    FgClass.prototype.emit = function () {
        this.eventEmitter.emit.apply(this.eventEmitter, arguments);
    };
    ;
    FgClass.prototype.emitApply = function (name, thisArg, args) {
        this.eventEmitter.emitApply(name, thisArg, args);
    };
    ;
    FgClass.prototype.cookData = function (data) {
        return data;
    };
    ;
    FgClass.prototype.render = function (data, meta, parent) {
        if (data instanceof HTMLElement) {
            return this.renderIn.apply(this, arguments);
        }
        ;
        var fg = new fgInstanceModule.FgInstance(this, parent);
        fg.code = fg.getHtml(data, meta);
        return fg;
    };
    ;
    FgClass.prototype.renderIn = function (parentNode, data, meta, parent) {
        var fg = this.render(data, meta, parent);
        parentNode.innerHTML = fg.code;
        fg.assign();
        return fg;
    };
    ;
    FgClass.prototype.appendTo = function (parentNode, data) {
        var fg = this.render(data);
        var div = document.createElement('div');
        div.innerHTML = fg.code;
        [].slice.call(div.children).forEach(function (child) {
            parentNode.appendChild(child);
        });
        fg.assign();
    };
    ;
    return FgClass;
}());
exports.FgClass = FgClass;
;
function match(fg, node, selector) {
    var domElms = fg.getDom();
    while (node) {
        if (node.matches(selector)) {
            return true;
        }
        ;
        if (domElms.indexOf(node) >= 0) {
            return false;
        }
        ;
        node = node.parentElement;
    }
    ;
    return false;
}
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmdDbGFzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jbGllbnQvZmdDbGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYiw2QkFBeUIsaUJBQWlCLENBQUMsQ0FBQTtBQUUzQyxJQUFZLFlBQVksV0FBTSxnQkFBZ0IsQ0FBQyxDQUFBO0FBQy9DLElBQVksZ0JBQWdCLFdBQU0sY0FBYyxDQUFDLENBQUE7QUFLdEMsb0JBQVksR0FBYyxFQUFFLENBQUM7QUFDN0IsbUJBQVcsR0FBRyxFQUFFLENBQUM7QUFNM0IsQ0FBQztBQUVGO0lBUUMsaUJBQVksSUFBa0I7UUFDN0IsSUFBSSxDQUFDLEVBQUUsR0FBRyxvQkFBWSxDQUFDLE1BQU0sQ0FBQztRQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDcEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxzQkFBWSxFQUFFLENBQUM7UUFDdkMsbUJBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQzlCLG9CQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCO1lBQ0MsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztRQUMzQixJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUM7UUFDNUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsU0FB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