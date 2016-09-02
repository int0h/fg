"use strict";
var utils = require('../utils');
var valueMgr = require('../valueMgr');
var Gap = (function () {
    function Gap(context, parsedMeta, parent) {
        utils.extend(this, parsedMeta); // todo: why?
        this.children = [];
        this.parent = parent || null;
        this.root = this;
        this.context = context;
        //this.scopePath = utils.getScopePath(this);
        //this.triggers = [];
        context.gapStorage.reg(this);
        if (this.path) {
            this.resolvedPath = valueMgr.resolvePath(this, this.path);
            if (this.resolvedPath.source === "data") {
                context.gapStorage.setTriggers(this, [this.resolvedPath.path]);
            }
            ;
        }
        ;
        if (!parent) {
            return this;
        }
        ;
        this.root = parent.root;
        parent.children.push(this);
    }
    ;
    Gap.parse = function (node, html, parentMeta) {
        return null;
    };
    ;
    Gap.prototype.update = function (context, meta, scopePath, value, oldValue) {
        return;
    };
    ;
    Gap.prototype.closest = function (selector) {
        var eid = selector.slice(1);
        var gap = this.parent;
        while (gap) {
            if (gap.eid === eid) {
                return gap;
            }
            ;
            gap = gap.parent;
        }
        ;
        return null;
    };
    ;
    Gap.prototype.data = function (val) {
        if (arguments.length === 0) {
            return utils.objPath(this.scopePath.path, this.context.data);
        }
        ;
        this.context.update(this.scopePath, val);
    };
    ;
    Gap.prototype.findRealDown = function () {
        if (!this.isVirtual) {
            return [this];
        }
        ;
        var res = [];
        this.children.forEach(function (child) {
            res = res.concat(child.findRealDown());
        });
        return res;
    };
    ;
    Gap.prototype.getDom = function () {
        if (!this.isVirtual) {
            var id = ["fg", this.context.id, "gid", this.gid].join('-');
            return [document.getElementById(id)];
        }
        ;
        var res = [];
        this.findRealDown().forEach(function (gap) {
            res = res.concat(gap.getDom());
        });
        return res;
    };
    ;
    Gap.prototype.removeDom = function () {
        var dom = this.getDom();
        dom.forEach(function (elm) {
            if (!elm) {
                return;
            }
            ;
            elm.remove();
        });
    };
    ;
    return Gap;
}());
exports.Gap = Gap;
;
function render(context, parent, data, meta) {
    var gapClass = gaps[meta.type];
    var gap = new gapClass(context, meta, parent);
    return gap.render(context, data);
}
exports.render = render;
;
function update(context, gapMeta, scopePath, value, oldValue) {
    var gapClass = gaps[gapMeta.type];
    if (!gapClass) {
        return;
    }
    ;
    return gapClass.update(context, gapMeta, scopePath, value, oldValue);
}
exports.update = update;
;
var gaps = require('../gaps');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FwQ2xhc3NNZ3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpZW50L2dhcENsYXNzTWdyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUtiLElBQVksS0FBSyxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBQ2xDLElBQVksUUFBUSxXQUFNLGFBQWEsQ0FBQyxDQUFBO0FBR3hDO0lBa0JDLGFBQWEsT0FBTyxFQUFFLFVBQVcsRUFBRSxNQUFPO1FBQ3pDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsYUFBYTtRQUM3QyxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUM7UUFDN0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsNENBQTRDO1FBQzVDLHFCQUFxQjtRQUNyQixPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUEsQ0FBQztZQUNkLElBQUksQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFBLENBQUM7Z0JBQ3hDLE9BQU8sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNoRSxDQUFDO1lBQUEsQ0FBQztRQUNILENBQUM7UUFBQSxDQUFDO1FBQ0YsRUFBRSxDQUFDLENBQUMsQ0FB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