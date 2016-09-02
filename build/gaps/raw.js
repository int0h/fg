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
        this.type = "raw";
    }
    GRaw.parse = function (node, html, parentMeta) {
        if (node.type !== "tag") {
            return null;
        }
        ;
        var hasDynamicAttrs = false;
        var meta = {};
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
            ? valueMgr.render(meta, data, this.resolvedPath)
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
    GRaw.priority = -1;
    return GRaw;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GRaw;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2dhcHMvcmF3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsSUFBWSxLQUFLLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbEMsSUFBWSxRQUFRLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDeEMsdUJBQXlDLFdBQVcsQ0FBQyxDQUFBO0FBQ3JELDRCQUFrQix1QkFBdUIsQ0FBQyxDQUFBO0FBRTFDLHVCQUFnQyxXQUFXLENBQUMsQ0FBQTtBQUU1QyxpQkFBaUIsSUFBSTtJQUNwQixFQUFFLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBQUEsQ0FBQztJQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQztBQUM5QixDQUFDO0FBQUEsQ0FBQztBQUVGO0lBQWtDLHdCQUFHO0lBQXJDO1FBQWtDLDhCQUFHO1FBS3BDLFNBQUksR0FBVyxLQUFLLENBQUM7SUE4R3RCLENBQUM7SUEzR08sVUFBSyxHQUFaLFVBQWEsSUFBYyxFQUFFLElBQWEsRUFBRSxVQUFnQjtRQUMzRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFBLENBQUM7WUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNiLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQzVCLElBQUksSUFBSSxHQUFTLEVBQVUsQ0FBQztRQUM1QixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztRQUNsQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUN2QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQztRQUM3QyxJ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