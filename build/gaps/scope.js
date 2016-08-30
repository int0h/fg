"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils = require('../utils');
var valueMgr = require('../valueMgr');
var gapClassMgr_1 = require('../client/gapClassMgr');
var tplMgr_1 = require('../tplMgr');
var anchorMgr = require('../anchorMgr');
function renderScopeContent(context, scopeMeta, scopeData, data, idOffset) {
    var isArray = Array.isArray(scopeData);
    if (!isArray) {
        scopeData = [scopeData];
    }
    ;
    var parts = scopeData.map(function (dataItem, id) {
        var itemMeta = scopeMeta;
        var path = isArray
            ? valueMgr.read([(id + idOffset).toString()])
            : valueMgr.read([]);
        var itemCfg = {
            "type": "scope-item",
            "isVirtual": true,
            "path": path,
            "content": scopeMeta.content
        };
        if (scopeMeta.eid) {
            itemCfg.eid = scopeMeta.eid + '-item';
        }
        ;
        itemMeta = new gapClassMgr.Gap(context, itemCfg, itemMeta);
        return gapClassMgr.render(context, scopeMeta, data, itemMeta);
    });
    return parts;
}
;
var GScope = (function (_super) {
    __extends(GScope, _super);
    function GScope() {
        _super.apply(this, arguments);
    }
    GScope.parse = function (node, html) {
        if (node.tagName !== "scope") {
            return null;
        }
        ;
        var meta;
        meta.type = "scope";
        meta.isVirtual = true;
        meta.path = utils.parsePath(node);
        meta.content = tplMgr_1.readTpl(node, html, meta);
        meta.eid = node.attrs.id || null;
        return meta;
    };
    ;
    GScope.prototype.render = function (context, data) {
        var meta = this;
        meta.items = [];
        var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
        this.scopePath = this.resolvedPath.path;
        var anchorCode = anchorMgr.genCode(context, meta);
        var parts = renderScopeContent(context, meta, scopeData, data, 0);
        return parts.join('\n') + anchorCode;
    };
    ;
    GScope.prototype.update = function (context, meta, scopePath, value, oldValue) {
        value = value || [];
        oldValue = oldValue || [];
        for (var i = value.length; i < oldValue.length; i++) {
            context.gapStorage.removeScope(scopePath.concat([i]));
        }
        ;
        if (value.length > oldValue.length) {
            var dataSlice = value.slice(oldValue.length);
            var newContent = renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
            var anchor = anchorMgr.find(context, meta);
            anchorMgr.insertHTML(anchor, 'before', newContent);
        }
        ;
    };
    ;
    return GScope;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GScope;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZ2Fwcy9zY29wZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUViLElBQVksS0FBSyxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBQ2xDLElBQVksUUFBUSxXQUFNLGFBQWEsQ0FBQyxDQUFBO0FBRXhDLDRCQUFrQix1QkFBdUIsQ0FBQyxDQUFBO0FBRTFDLHVCQUFnQyxXQUFXLENBQUMsQ0FBQTtBQUM1QyxJQUFZLFNBQVMsV0FBTSxjQUFjLENBQUMsQ0FBQTtBQUUxQyw0QkFBNEIsT0FBbUIsRUFBRSxTQUFjLEVBQUUsU0FBYyxFQUFFLElBQVMsRUFBRSxRQUFnQjtJQUMzRyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUEsQ0FBQztRQUNiLFNBQVMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFBQSxDQUFDO0lBQ0YsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFTLFFBQVEsRUFBRSxFQUFFO1FBQzlDLElBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQztRQUN6QixJQUFJLElBQUksR0FBRyxPQUFPO2NBQ2YsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Y0FDM0MsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNyQixJQUFJLE9BQU8sR0FBUTtZQUNsQixNQUFNLEVBQUUsWUFBWTtZQUNwQixXQUFXLEVBQUUsSUFBSTtZQUNqQixNQUFNLEVBQUUsSUFBSTtZQUNaLFNBQVMsRUFBRSxTQUFTLENBQUMsT0FBTztTQUM1QixDQUFDO1FBQ0YsRUFBRSxDQUFDLENBQUMsU0FBUyxD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