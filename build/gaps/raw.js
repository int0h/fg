"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils = require('../utils');
var valueMgr = require('../valueMgr');
var StrTpl_1 = require('../StrTpl');
var gapClassMgr_1 = require('../client/gapClassMgr');
var tplMgr_1 = require('../tplMgr');
function isScope(item) {
    if (typeof item === "string") {
        return false;
    }
    ;
    return item.type === "scope";
}
;
var GRaw = (function (_super) {
    __extends(GRaw, _super);
    function GRaw() {
        _super.apply(this, arguments);
    }
    GRaw.parse = function (node, html, parentMeta) {
        if (node.type !== "tag") {
            return null;
        }
        ;
        var hasDynamicAttrs = false;
        var meta;
        meta.type = "raw";
        meta.isVirtual = false;
        meta.isRootNode = node.parent.type !== "tag";
        meta.tagName = node.tagName;
        if ("id" in node.attrs) {
            meta.eid = node.attrs.id.value;
            delete node.attrs.id;
        }
        ;
        var attrsArr = utils.objToKeyValue(node.attrs, 'name', 'value');
        attrsArr = attrsArr.map(function (attr) {
            var attrVal = attr.value.type === "string"
                ? attr.value.value
                : (attr.value.escaped ? '#' : '!') + '{' + attr.value.key + '}';
            var value = StrTpl_1.read(attrVal, valueMgr.parse);
            var name = StrTpl_1.read(attr.name, valueMgr.parse);
            if (typeof value !== "string" || typeof name !== "string") {
                hasDynamicAttrs = true;
            }
            ;
            return {
                "name": name,
                "value": value
            };
        });
        meta.attrs = utils.keyValueToObj(attrsArr, 'name', 'value');
        if (node.value) {
            meta.path = valueMgr.parse(node.value.path, {
                escaped: node.value.escaped
            });
        }
        ;
        meta.content = tplMgr_1.readTpl(node, null, meta);
        if (meta.content.some(isScope)) {
            meta.isScopeHolder = true;
        }
        ;
        if (parentMeta && parentMeta.type === "scope") {
            meta.isScopeItem = true;
        }
        ;
        if (!hasDynamicAttrs
            && !meta.eid
            && !meta.isRootNode
            && !meta.isScopeHolder
            && !meta.isScopeItem
            && !meta.path) {
            return null;
        }
        ;
        return meta;
    };
    ;
    GRaw.prototype.render = function (context, data) {
        var meta = this;
        if (meta.isScopeHolder) {
            meta.root.currentScopeHolder = meta;
        }
        ;
        var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
        var attrObj = {};
        attrsArr.forEach(function (attr) {
            var name = new StrTpl_1.StrTpl(attr.name).render(valueMgr.resolveAndRender.bind(null, meta, data));
            var value = new StrTpl_1.StrTpl(attr.value).render(valueMgr.resolveAndRender.bind(null, meta, data));
            attrObj[name] = value;
        });
        var triggers = [];
        context.gapStorage.setTriggers(meta, triggers);
        var inner = meta.path
            ? valueMgr.getValue(meta, data, this.resolvedPath)
            : context.renderTpl(meta.content, meta, data);
        return utils.renderTag({
            "name": meta.tagName,
            "attrs": attrObj,
            "innerHTML": inner
        });
    };
    ;
    GRaw.prototype.update = function (context, meta, scopePath, value) {
        // to do value update
        /*var attrData = utils.objPath(meta.scopePath, context.data);
        var renderedAttrs = utils.renderAttrs(meta.attrs, attrData);*/
        var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
        var attrObj = {};
        attrsArr.forEach(function (attr) {
            var name = new StrTpl_1.StrTpl(attr.name).render(valueMgr.render.bind(null, meta, context.data));
            var value = new StrTpl_1.StrTpl(attr.value).render(function (path) {
                var resolvedPath = valueMgr.resolvePath(meta, path);
                return valueMgr.render(meta, context.data, resolvedPath);
            });
            attrObj[name] = value;
        });
        var dom = meta.getDom()[0];
        if (meta.path && meta.path.path.join('-') === scopePath.join('-')) {
            dom.innerHTML = meta.path.escaped
                ? utils.escapeHtml(value)
                : value;
        }
        ;
        utils.objFor(attrObj, function (value, name) {
            var oldVal = dom.getAttribute(name);
            if (oldVal !== value) {
                dom.setAttribute(name, value);
            }
            ;
        });
    };
    ;
    return GRaw;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GRaw;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2dhcHMvcmF3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsSUFBWSxLQUFLLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbEMsSUFBWSxRQUFRLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDeEMsdUJBQXlDLFdBQVcsQ0FBQyxDQUFBO0FBRXJELDRCQUFrQix1QkFBdUIsQ0FBQyxDQUFBO0FBRTFDLHVCQUFnQyxXQUFXLENBQUMsQ0FBQTtBQUU1QyxpQkFBaUIsSUFBSTtJQUNwQixFQUFFLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBQUEsQ0FBQztJQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQztBQUM5QixDQUFDO0FBQUEsQ0FBQztBQUVGO0lBQWtDLHdCQUFHO0lBQXJDO1FBQWtDLDhCQUFHO0lBaUhyQyxDQUFDO0lBM0dPLFVBQUssR0FBWixVQUFhLElBQWMsRUFBRSxJQUFZLEVBQUUsVUFBZTtRQUN6RCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFBLENBQUM7WUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNiLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQzVCLElBQUksSUFBVSxDQUFDO1FBQ2YsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7UUFDbEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUM7UUFDN0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFD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