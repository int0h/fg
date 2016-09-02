"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tplRender_1 = require('../tplRender');
var gapClassMgr = require('./gapClassMgr');
var eventEmitter_1 = require('../eventEmitter');
var utils = require('../utils');
var GapStorage_1 = require('./GapStorage');
var globalEvents = require('./globalEvents');
var root_1 = require('../gaps/root');
var helper = require('./helper');
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
        var rootGap = new root_1.default(this, meta);
        rootGap.type = "root";
        rootGap.isVirtual = true;
        rootGap.fg = this;
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
            gap.update(self, gap, scopePath, value, oldValue);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmdJbnN0YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jbGllbnQvZmdJbnN0YW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUViLDBCQUFzQixjQUFjLENBQUMsQ0FBQTtBQUNyQyxJQUFZLFdBQVcsV0FBTSxlQUFlLENBQUMsQ0FBQTtBQUU3Qyw2QkFBeUIsaUJBQWlCLENBQUMsQ0FBQTtBQUkzQyxJQUFZLEtBQUssV0FBTSxVQUFVLENBQUMsQ0FBQTtBQUNsQywyQkFBdUIsY0FBYyxDQUFDLENBQUE7QUFDdEMsSUFBWSxZQUFZLFdBQU0sZ0JBQWdCLENBQUMsQ0FBQTtBQUMvQyxxQkFBa0IsY0FBYyxDQUFDLENBQUE7QUFDakMsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRXRCLHVCQUFlLEdBQWlCLEVBQUUsQ0FBQztBQUVoRDtJQWNDLHdCQUFZLE9BQWdCLEVBQUUsTUFBa0I7UUFDL0MsSUFBSSxDQUFDLEVBQUUsR0FBRyx1QkFBZSxDQUFDLE1BQU0sQ0FBQztRQUNqQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksSUFBSSxDQUFDO1FBQzdCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxzQkFBWSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksb0JBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNuQix1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