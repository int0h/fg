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
    }
    GFg.parse = function (node) {
        if (node.type != 'tag' || !~node.tagName.indexOf("fg-")) {
            return null;
        }
        ;
        var meta;
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
        var fgClass = $fg.classes[this.fgName];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZ2Fwcy9mZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUViLElBQVksS0FBSyxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBQ2xDLElBQVksUUFBUSxXQUFNLGFBQWEsQ0FBQyxDQUFBO0FBRXhDLDRCQUFrQix1QkFBdUIsQ0FBQyxDQUFBO0FBRTFDLHVCQUFnQyxXQUFXLENBQUMsQ0FBQTtBQUU1QztJQUFpQyx1QkFBRztJQUFwQztRQUFpQyw4QkFBRztJQTRDcEMsQ0FBQztJQXhDTyxTQUFLLEdBQVosVUFBYSxJQUFjO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBLENBQUM7WUFDeEQsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNiLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxJQUFRLENBQUM7UUFDYixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQztRQUNqQyxJQUFJLENBQUMsT0FBTyxHQUFHLGdCQUFPLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQzs7SUFFRCxvQkFBTSxHQUFOLFVBQU8sT0FBbUIsRUFBRSxJQUFTO1FBQ3BDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN4QixxRUFBcUU7UUFDckUsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkMsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDL0UsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQy9DLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVMsSUFBSSxFQUFFLEdBQUc7WUFDakMsOENBQThDO1lBQzlDLHlCQUF5QjtRQUMxQixDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxQixNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1gsQ0FBQzs7SUFFRCxvQkFBTSxHQUFOLFVBQU8sT0FBbUIsRUFBRSxJQUFTLEVBQUUsU0FBYyxFQUFFLEtBQVU7UUFDaEUsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsQ0FBQztRQUVYLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsNkNBQTZDO0lBQzlDLENBQUM7O0lBRUYsVUFBQztBQUFELENBQUMsQUE1Q0QsQ0FBaUMsaUJBQUcsR0E0Q25DO0FBNUNEO3FCQTRDQyxDQUFBO0FBQUEsQ0FBQyJ9