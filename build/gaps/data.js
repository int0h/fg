"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils = require('../utils');
var valueMgr = require('../valueMgr');
var gapClassMgr_1 = require('../client/gapClassMgr');
var GData = (function (_super) {
    __extends(GData, _super);
    function GData() {
        _super.apply(this, arguments);
        this.type = "data";
    }
    GData.parse = function (node) {
        if (node.tagName != "data") {
            return null;
        }
        ;
        var meta = {};
        meta.type = "data";
        meta.isVirtual = false;
        meta.path = utils.parsePath(node);
        meta.eid = node.attrs.id || null;
        return meta;
    };
    ;
    GData.prototype.render = function (context, data) {
        var value = valueMgr.render(this, data, this.resolvedPath);
        return utils.renderTag({
            name: "span",
            attrs: this.attrs,
            innerHTML: value
        });
    };
    ;
    GData.prototype.update = function (context, meta, scopePath, value) {
        var node = meta.getDom()[0];
        if (!node) {
        }
        ;
        node.innerHTML = value;
        //highlight(node, [0xffffff, 0xffee88], 500);
    };
    ;
    return GData;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GData;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nYXBzL2RhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFFYixJQUFZLEtBQUssV0FBTSxVQUFVLENBQUMsQ0FBQTtBQUNsQyxJQUFZLFFBQVEsV0FBTSxhQUFhLENBQUMsQ0FBQTtBQUN4Qyw0QkFBa0IsdUJBQXVCLENBQUMsQ0FBQTtBQUkxQztJQUFtQyx5QkFBRztJQUF0QztRQUFtQyw4QkFBRztRQUVyQyxTQUFJLEdBQVcsTUFBTSxDQUFDO0lBZ0N2QixDQUFDO0lBOUJPLFdBQUssR0FBWixVQUFhLElBQWM7UUFDMUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQSxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksSUFBSSxHQUFVLEVBQVcsQ0FBQztRQUM5QixJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztRQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUM7UUFDakMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNiLENBQUM7O0lBRUQsc0JBQU0sR0FBTixVQUFPLE9BQW1CLEVBQUUsSUFBUztRQUNwQyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNELE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO1lBQ3RCLElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLFNBQVMsRUFBRSxLQUFLO1NBQ2hCLENBQUMsQ0FBQztJQUNKLENBQUM7O0lBRUQsc0JBQU0sR0FBTixVQUFPLE9BQW1CLEVBQUUsSUFBUyxFQUFFLFNBQWMsRUFBRSxLQUFVO1FBQ2hFLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLENBQUM7UUFFWCxDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLDZDQUE2QztJQUM5QyxDQUFDOztJQUVGLFlBQUM7QUFBRCxDQUFDLEFBbENELENBQW1DLGlCQUFHLEdBa0NyQztBQWxDRDt1QkFrQ0MsQ0FBQTtBQUFBLENBQUMifQ==