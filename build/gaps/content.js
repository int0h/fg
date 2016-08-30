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
    }
    GContent.parse = function (node) {
        if (node.tagName !== "content") {
            return null;
        }
        ;
        var meta;
        meta.type = "content";
        meta.isVirtual = true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nYXBzL2NvbnRlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFLYiw0QkFBa0IsdUJBQXVCLENBQUMsQ0FBQTtBQUkxQztJQUFzQyw0QkFBRztJQUF6QztRQUFzQyw4QkFBRztJQXVCekMsQ0FBQztJQXJCTyxjQUFLLEdBQVosVUFBYSxJQUFjO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUEsQ0FBQztZQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLElBQWMsQ0FBQztRQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztRQUN0QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0Qjs7Ozs7MERBS2tEO1FBQ2xELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELHlCQUFNLEdBQU4sVUFBTyxPQUFtQixFQUFFLElBQVM7UUFDcEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUMzQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwRyxDQUFDOztJQUVGLGVBQUM7QUFBRCxDQUFDLEFBdkJELENBQXNDLGlCQUFHLEdBdUJ4QztBQXZCRDswQkF1QkMsQ0FBQTtBQUFBLENBQUMifQ==