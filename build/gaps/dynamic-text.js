"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var valueMgr = require('../valueMgr');
var StrTpl_1 = require('../StrTpl');
var gapClassMgr_1 = require('../client/gapClassMgr');
var data_1 = require('./data');
var GDynamicText = (function (_super) {
    __extends(GDynamicText, _super);
    function GDynamicText() {
        _super.apply(this, arguments);
        this.type = "dynamicText";
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
        var meta = {};
        meta.type = "dynamicText";
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
            var itemMeta = new data_1.default(context, dataMeta, meta.parent);
            return itemMeta.render(context, data);
        });
    };
    ;
    return GDynamicText;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GDynamicText;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1pYy10ZXh0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2dhcHMvZHluYW1pYy10ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBR2IsSUFBWSxRQUFRLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDeEMsdUJBQXNDLFdBQVcsQ0FBQyxDQUFBO0FBQ2xELDRCQUEwQix1QkFBdUIsQ0FBQyxDQUFBO0FBR2xELHFCQUFrQixRQUFRLENBQUMsQ0FBQTtBQUUzQjtJQUEwQyxnQ0FBRztJQUE3QztRQUEwQyw4QkFBRztRQUc1QyxTQUFJLEdBQVcsYUFBYSxDQUFDO0lBNkI5QixDQUFDO0lBM0JPLGtCQUFLLEdBQVosVUFBYSxJQUFjO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUEsQ0FBQztZQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLEdBQUcsR0FBRyxhQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0MsRUFBRSxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUEsQ0FBQztZQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLElBQUksR0FBaUIsRUFBa0IsQ0FBQztRQUM1QyxJQUFJLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQztRQUMxQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELDZCQUFNLEdBQU4sVUFBTyxPQUFtQixFQUFFLElBQVM7UUFDcEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLElBQUksR0FBRyxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVMsSUFBSTtZQUM5QixJQUFJLFFBQVEsR0FBRztnQkFDZCxNQUFNLEVBQUUsTUFBTTtnQkFDZCxNQUFNLEVBQUUsSUFBSTthQUNaLENBQUM7WUFDRixJQUFJLFFBQVEsR0FBRyxJQUFJLGNBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDOztJQUVGLG1CQUFDO0FBQUQsQ0FBQyxBQWhDRCxDQUEwQyxpQkFBRyxHQWdDNUM7QUFoQ0Q7OEJBZ0NDLENBQUE7QUFBQSxDQUFDIn0=