"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tplRender_1 = require('../tplRender');
var gapClassMgr = require('./gapClassMgr');
var eventEmitter_1 = require('../eventEmitter');
var gapClassMgr_1 = require('./gapClassMgr');
var utils = require('../utils');
var GapStorage_1 = require('./GapStorage');
var helper = require('./helper.js');
var globalEvents = require('fg-js/client/globalEvents.js');
exports.fgInstanceTable = [];
var FgInstanceBase = (function () {
    function FgInstanceBase(fgClass, parent) {
        this.id = exports.fgInstanceTable.length;
        fgClass.instances.push(this);
        this.name = fgClass.name;
        this.fgClass = fgClass;
        this.code = null;
        this.parent = parent || null;
        this.eventEmitter = new eventEmitter_1.default(fgClass.eventEmitter);
        this.gapStorage = new GapStorage_1.default(this);
        this.childFgs = [];
        exports.fgInstanceTable.push(this);
    }
    ;
    FgInstanceBase.prototype.on = function (event, fn) {
        globalEvents.listen(event);
        this.eventEmitter.on(event, fn);
    };
    ;
    FgInstanceBase.prototype.emit = function () {
        var rest = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rest[_i - 0] = arguments[_i];
        }
        this.eventEmitter.emit.apply(this.eventEmitter, arguments);
    };
    ;
    FgInstanceBase.prototype.emitApply = function () {
        var rest = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rest[_i - 0] = arguments[_i];
        }
        this.eventEmitter.emit.apply(this.eventEmitter, arguments);
    };
    ;
    FgInstanceBase.prototype.toString = function () {
        return this.code;
    };
    ;
    FgInstanceBase.prototype.assign = function () {
        // this.emitApply('ready', this, []);
        // this.dom = document.getElementById('fg-iid-' + this.id);
        // this.gapStorage.assign();
        // return this.dom;
    };
    ;
    FgInstanceBase.prototype.renderTpl = function (tpl, parent, data, meta) {
        return tplRender_1.default.call({
            "renderGap": gapClassMgr.render,
            "context": this
        }, tpl, parent, data, meta);
    };
    ;
    FgInstanceBase.prototype.getHtml = function (data, meta) {
        this.data = data;
        this.gapMeta = meta;
        var rootGap = new gapClassMgr_1.Gap(this, meta);
        rootGap.type = "root";
        rootGap.isVirtual = true;
        rootGap.fg = this;
        rootGap.scopePath.path = [];
        this.meta = rootGap;
        var cookedData = this.fgClass.cookData(data);
        return this.renderTpl(this.fgClass.tpl, rootGap, cookedData, metaMap.bind(null, this));
    };
    ;
    FgInstanceBase.prototype.update = function (scopePath, newValue) {
        if (arguments.length === 0) {
            return this.update([], this.data); // todo
        }
        ;
        if (arguments.length === 1) {
            return this.update([], arguments[0]);
        }
        ;
        var value = utils.deepClone(newValue);
        var self = this;
        var oldValue = utils.objPath(scopePath, this.data);
        if (oldValue === value) {
            return this;
        }
        ;
        this.emit('update', scopePath, newValue);
        if (scopePath.length > 0) {
            utils.objPath(scopePath, this.data, value);
        }
        else {
            this.data = value;
        }
        var scope = this.gapStorage.byScope(scopePath);
        var gaps = scope.target;
        gaps.forEach(function (gap) {
            gapClassMgr.update(self, gap, scopePath, value, oldValue);
        });
        scope.parents.forEach(function (parentNode) {
            parentNode.data.gaps.forEach(function (parentGap) {
                if (parentGap.type === "fg") {
                    var subPath = scopePath.slice(parentGap.scopePath.length);
                    //var subVal = utils.objPath(subPath, self.data);
                    parentGap.fg.update(subPath, newValue);
                }
                ;
            });
        });
        scope.subs.forEach(function (sub) {
            var subVal = utils.objPath(sub.path, self.data);
            var subPath = sub.path.slice(scopePath.length);
            var oldSubVal = utils.objPath(subPath, oldValue);
            if (subVal === oldSubVal) {
                return;
            }
            ;
            sub.gaps.forEach(function (gap) {
                if (self.gapStorage.gaps.indexOf(gap) < 0) {
                    return;
                }
                ;
                gapClassMgr.update(self, gap, sub.path, subVal, oldSubVal);
            });
        });
        return this;
    };
    ;
    FgInstanceBase.prototype.cloneData = function () {
        return utils.deepClone(this.data);
    };
    ;
    FgInstanceBase.prototype.clear = function () {
        this.childFgs.forEach(function (child) {
            child.remove(true);
        });
        this.code = '';
        this.data = null;
        this.gapStorage = null;
        this.childFgs = [];
    };
    ;
    FgInstanceBase.prototype.remove = function (virtual) {
        if (!virtual) {
            var dom = this.getDom();
            dom.forEach(function (elm) {
                elm.remove();
            });
        }
        ;
        this.clear();
        var instanceId = this.fgClass.instances.indexOf(this);
        this.fgClass.instances.splice(instanceId, 1);
        exports.fgInstanceTable[this.id] = null;
    };
    ;
    FgInstanceBase.prototype.rerender = function (data) {
        this.clear();
        this.gapStorage = new GapStorage_1.default(this);
        var dom = this.getDom()[0];
        this.code = this.getHtml(data, null);
        dom.outerHTML = this.code; // doesnt work with multi root
        this.assign();
        return this;
    };
    ;
    FgInstanceBase.prototype.getDom = function () {
        return this.meta.getDom();
    };
    ;
    FgInstanceBase.prototype.jq = function () {
        var dom = this.getDom();
        var res = helper.jq(dom);
        if (arguments.length === 0) {
            return res;
        }
        ;
        var selector = arguments[0];
        var selfSelected = res
            .parent()
            .find(selector)
            .filter(function (id, elm) {
            return dom.indexOf(elm) >= 0;
        });
        var childSelected = res.find(selector);
        return selfSelected.add(childSelected);
    };
    ;
    FgInstanceBase.prototype.gap = function (id) {
        return this.gaps(id)[0];
    };
    ;
    FgInstanceBase.prototype.gaps = function (id) {
        var gaps = this.gapStorage.byEid(id);
        if (gaps) {
            return gaps;
        }
        ;
    };
    ;
    FgInstanceBase.prototype.sub = function (id) {
        var gap = this.gap(id);
        if (!gap) {
            return null;
        }
        ;
        return gap.fg || null;
    };
    ;
    return FgInstanceBase;
}());
exports.FgInstanceBase = FgInstanceBase;
;
var FgInstance = (function (_super) {
    __extends(FgInstance, _super);
    function FgInstance(fgClass, parent) {
        if (!!false) {
            _super.call(this, fgClass, parent);
        }
        ;
        return new fgClass.createFn(fgClass, parent);
    }
    ;
    return FgInstance;
}(FgInstanceBase));
exports.FgInstance = FgInstance;
;
function getClasses(meta) {
    if (!meta || !meta.attrs || !meta.attrs.class) {
        return [];
    }
    ;
    if (Array.isArray(meta.attrs.class)) {
        return meta.attrs.class;
    }
    ;
    return meta.attrs.class.split(' ');
}
;
function metaMap(fg, metaPart) {
    var res = utils.simpleClone(metaPart);
    var classes = getClasses(res);
    var fg_cid = "fg-cid-" + fg.fgClass.id;
    res.attrs = utils.simpleClone(metaPart.attrs);
    if (Array.isArray(res.attrs.class)) {
        res.attrs.class = ['fg', ' ', fg_cid, ' '].concat(classes);
        return res;
    }
    ;
    res.attrs.class = ['fg', fg_cid].concat(classes).join(' ');
    return res;
}
;
function createScopeHelper(fg, obj, scopePath) {
    var helper = Array.isArray(obj)
        ? []
        : {};
    utils.objFor(obj, function (value, key) {
        var propScopePath = scopePath.concat([key]);
        Object.defineProperty(helper, key, {
            get: function () {
                if (typeof value === "object") {
                    return createScopeHelper(fg, obj[key], propScopePath);
                }
                ;
                return obj[key];
            },
            set: function (val) {
                fg.update(propScopePath, val);
            }
        });
    });
    return helper;
}
;
function getFgByIid(iid) {
    return exports.fgInstanceTable[iid];
}
exports.getFgByIid = getFgByIid;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmdJbnN0YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jbGllbnQvZmdJbnN0YW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUViLDBCQUFzQixjQUFjLENBQUMsQ0FBQTtBQUNyQyxJQUFZLFdBQVcsV0FBTSxlQUFlLENBQUMsQ0FBQTtBQUU3Qyw2QkFBeUIsaUJBQWlCLENBQUMsQ0FBQTtBQUUzQyw0QkFBa0IsZUFBZSxDQUFDLENBQUE7QUFFbEMsSUFBWSxLQUFLLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbEMsMkJBQXVCLGNBQWMsQ0FBQyxDQUFBO0FBQ3RDLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNwQyxJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsOEJBQThCLENBQUMsQ0FBQztBQUVoRCx1QkFBZSxHQUFHLEVBQUUsQ0FBQztBQUVoQztJQWNDLHdCQUFZLE9BQWdCLEVBQUUsTUFBa0I7UUFDL0MsSUFBSSxDQUFDLEVBQUUsR0FBRyx1QkFBZSxDQUFDLE1BQU0sQ0FBQztRQUNqQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksSUFBSSxDQUFDO1FBQzdCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxzQkFBWSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksb0JBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FB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