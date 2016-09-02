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
var GFg = (function (_super) {
    __extends(GFg, _super);
    function GFg() {
        _super.apply(this, arguments);
        this.type = "fg";
    }
    GFg.parse = function (node) {
        if (node.type != 'tag' || !~node.tagName.indexOf("fg-")) {
            return null;
        }
        ;
        var meta = {};
        meta.type = "fg";
        meta.isVirtual = true;
        meta.fgName = node.tagName.slice(3);
        meta.path = utils.parsePath(node);
        meta.eid = node.attrs.id || null;
        meta.content = tplMgr_1.readTpl(node, null, meta);
        return meta;
    };
    ;
    GFg.prototype.render = function (context, data) {
        var self = this;
        this.parentFg = context;
        //this.renderedContent = context.renderTpl(this.content, meta, data);
        var fgClass = window['$fg'].classes[this.fgName];
        var fgData = utils.deepClone(valueMgr.getValue(this, data, this.resolvedPath));
        var fg = fgClass.render(fgData, this, context);
        fg.on('update', function (path, val) {
            //context.update(scopePath.concat(path), val);
            //console.log(path, val);
        });
        this.fg = fg;
        fg.meta = this;
        context.childFgs.push(fg);
        return fg;
    };
    ;
    GFg.prototype.update = function (context, meta, scopePath, value) {
        var node = meta.getDom()[0];
        if (!node) {
        }
        ;
        node.innerHTML = value;
        //highlight(node, [0xffffff, 0xffee88], 500);
    };
    ;
    return GFg;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GFg;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZ2Fwcy9mZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUViLElBQVksS0FBSyxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBQ2xDLElBQVksUUFBUSxXQUFNLGFBQWEsQ0FBQyxDQUFBO0FBQ3hDLDRCQUFrQix1QkFBdUIsQ0FBQyxDQUFBO0FBRTFDLHVCQUFnQyxXQUFXLENBQUMsQ0FBQTtBQUU1QztJQUFpQyx1QkFBRztJQUFwQztRQUFpQyw4QkFBRztRQUduQyxTQUFJLEdBQVcsSUFBSSxDQUFDO0lBMENyQixDQUFDO0lBeENPLFNBQUssR0FBWixVQUFhLElBQWM7UUFDMUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUN4RCxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLElBQUksR0FBTyxFQUFTLENBQUM7UUFDekIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUM7UUFDakMsSUFBSSxDQUFDLE9BQU8sR0FBRyxnQkFBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNiLENBQUM7O0lBRUQsb0JBQU0sR0FBTixVQUFPLE9BQW1CLEVBQUUsSUFBUztRQUNwQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFDeEIscUVBQXFFO1FBQ3JFLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pELElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQy9FLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFTLElBQUksRUFBRSxHQUFHO1lBQ2pDLDhDQUE4QztZQUM5Qyx5QkFBeUI7UUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUIsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNYLENBQUM7O0lBRUQsb0JBQU0sR0FBTixVQUFPLE9BQW1CLEVBQUUsSUFBUyxFQUFFLFNBQWMsRUFBRSxLQUFVO1FBQ2hFLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLENBQUM7UUFFWCxDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLDZDQUE2QztJQUM5QyxDQUFDOztJQUVGLFVBQUM7QUFBRCxDQUFDLEFBN0NELENBQWlDLGlCQUFHLEdBNkNuQztBQTdDRDtxQkE2Q0MsQ0FBQTtBQUFBLENBQUMifQ==