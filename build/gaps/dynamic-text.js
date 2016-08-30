"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var valueMgr = require('../valueMgr');
var StrTpl_1 = require('../StrTpl');
var gapClassMgr_1 = require('../client/gapClassMgr');
var GDynamicText = (function (_super) {
    __extends(GDynamicText, _super);
    function GDynamicText() {
        _super.apply(this, arguments);
    }
    GDynamicText.parse = function (node) {
        if (node.type !== "text") {
            return null;
        }
        ;
        var tpl = StrTpl_1.read(node.text, valueMgr.parse);
        if (typeof tpl === "string") {
            return null;
        }
        ;
        var meta;
        meta.type = "dynamic-text";
        meta.tpl = tpl;
        return meta;
    };
    ;
    GDynamicText.prototype.render = function (context, data) {
        var meta = this;
        var tpl = new StrTpl_1.StrTpl(meta.tpl, valueMgr.parse);
        return tpl.render(function (path) {
            var dataMeta = {
                "type": "data",
                "path": path
            };
            var itemMeta = new gapClassMgr.Gap(context, dataMeta, meta.parent);
            return gapClassMgr.render(context, meta.parent, data, itemMeta);
        });
    };
    ;
    return GDynamicText;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GDynamicText;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1pYy10ZXh0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2dhcHMvZHluYW1pYy10ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBR2IsSUFBWSxRQUFRLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDeEMsdUJBQXNDLFdBQVcsQ0FBQyxDQUFBO0FBRWxELDRCQUFrQix1QkFBdUIsQ0FBQyxDQUFBO0FBSTFDO0lBQTBDLGdDQUFHO0lBQTdDO1FBQTBDLDhCQUFHO0lBK0I3QyxDQUFDO0lBM0JPLGtCQUFLLEdBQVosVUFBYSxJQUFjO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUEsQ0FBQztZQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLEdBQUcsR0FBRyxhQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0MsRUFBRSxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUEsQ0FBQztZQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLElBQWtCLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxjQUFjLENBQUM7UUFDM0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQzs7SUFFRCw2QkFBTSxHQUFOLFVBQU8sT0FBbUIsRUFBRSxJQUFTO1FBQ3BDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLEdBQUcsR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFTLElBQUk7WUFDOUIsSUFBSSxRQUFRLEdBQUc7Z0JBQ2QsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsTUFBTSxFQUFFLElBQUk7YUFDWixDQUFDO1lBQ0YsSUFBSSxRQUFRLEdBQUcsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNqRSxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7O0lBRUYsbUJBQUM7QUFBRCxDQUFDLEFBL0JELENBQTBDLGlCQUFHLEdBK0I1QztBQS9CRDs4QkErQkMsQ0FBQTtBQUFBLENBQUMifQ==