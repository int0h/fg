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
var scope_item_1 = require('./scope-item');
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
            "type": "scopeItem",
            "isVirtual": true,
            "path": path,
            "content": scopeMeta.content
        };
        if (scopeMeta.eid) {
            itemCfg.eid = scopeMeta.eid + '-item';
        }
        ;
        itemMeta = new scope_item_1.default(context, itemCfg, itemMeta);
        return gapClassMgr_1.render(context, scopeMeta, data, itemMeta);
    });
    return parts;
}
;
var GScope = (function (_super) {
    __extends(GScope, _super);
    function GScope() {
        _super.apply(this, arguments);
        this.type = "scope";
    }
    GScope.parse = function (node, html) {
        if (node.tagName !== "scope") {
            return null;
        }
        ;
        var meta = {};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZ2Fwcy9zY29wZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUViLElBQVksS0FBSyxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBQ2xDLElBQVksUUFBUSxXQUFNLGFBQWEsQ0FBQyxDQUFBO0FBQ3hDLDRCQUEwQix1QkFBdUIsQ0FBQyxDQUFBO0FBRWxELHVCQUFnQyxXQUFXLENBQUMsQ0FBQTtBQUM1QyxJQUFZLFNBQVMsV0FBTSxjQUFjLENBQUMsQ0FBQTtBQUMxQywyQkFBdUIsY0FBYyxDQUFDLENBQUE7QUFFdEMsNEJBQTRCLE9BQW1CLEVBQUUsU0FBYyxFQUFFLFNBQWMsRUFBRSxJQUFTLEVBQUUsUUFBZ0I7SUFDM0csSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBLENBQUM7UUFDYixTQUFTLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN6QixDQUFDO0lBQUEsQ0FBQztJQUNGLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBUyxRQUFRLEVBQUUsRUFBRTtRQUM5QyxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUM7UUFDekIsSUFBSSxJQUFJLEdBQUcsT0FBTztjQUNmLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2NBQzNDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckIsSUFBSSxPQUFPLEdBQVE7WUFDbEIsTUFBTSxFQUFFLFdBQVc7WUFDbkIsV0FBVyxFQUFFLElBQUk7WUFDakIsTUFBTSxFQUFFLElBQUk7WUFDWixTQUFTLEVBQUUsU0FBUyxDQUFDLE9BQU87U0FDNUIsQ0FB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