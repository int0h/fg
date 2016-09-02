"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var gapClassMgr_1 = require('../client/gapClassMgr');
var GContent = (function (_super) {
    __extends(GContent, _super);
    function GContent() {
        _super.apply(this, arguments);
        this.type = "content";
    }
    GContent.parse = function (node) {
        if (node.tagName !== "content") {
            return null;
        }
        ;
        var meta = {};
        meta.isVirtual = true;
        meta.type = "content";
        /*meta.fgName = node.nodeName.slice(3);
        meta.path = node.attrs.class
            ? node.attrs.class.split(' ')
            : [];
        meta.eid = node.attrs.id || null;
        meta.content = tplMgr.readTpl(node, html, meta);*/
        return meta;
    };
    ;
    GContent.prototype.render = function (context, data) {
        this.scopePath = context.gapMeta.scopePath;
        return context.parent.renderTpl(context.meta.content, context.gapMeta.parent, context.parent.data);
    };
    ;
    return GContent;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GContent;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nYXBzL2NvbnRlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFJYiw0QkFBa0IsdUJBQXVCLENBQUMsQ0FBQTtBQUkxQztJQUFzQyw0QkFBRztJQUF6QztRQUFzQyw4QkFBRztRQUV4QyxTQUFJLEdBQVcsU0FBUyxDQUFDO0lBdUIxQixDQUFDO0lBckJPLGNBQUssR0FBWixVQUFhLElBQWM7UUFDMUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLENBQUMsQ0FBQSxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksSUFBSSxHQUFhLEVBQWMsQ0FBQztRQUNwQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztRQUN0Qjs7Ozs7MERBS2tEO1FBQ2xELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELHlCQUFNLEdBQU4sVUFBTyxPQUFtQixFQUFFLElBQVM7UUFDcEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUMzQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwRyxDQUFDOztJQUVGLGVBQUM7QUFBRCxDQUFDLEFBekJELENBQXNDLGlCQUFHLEdBeUJ4QztBQXpCRDswQkF5QkMsQ0FBQTtBQUFBLENBQUMifQ==