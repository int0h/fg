"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var valueMgr = require('../valueMgr');
var gapClassMgr_1 = require('../client/gapClassMgr');
var GScopeItem = (function (_super) {
    __extends(GScopeItem, _super);
    function GScopeItem() {
        _super.apply(this, arguments);
        this.type = "scopeItem";
    }
    GScopeItem.parse = function (node) {
        return null;
    };
    ;
    GScopeItem.prototype.render = function (context, data) {
        var meta = this;
        var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
        this.scopePath = this.resolvedPath.path;
        if (!scopeData) {
            return '';
        }
        ;
        return context.renderTpl(meta.content, meta, data);
    };
    ;
    return GScopeItem;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GScopeItem;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGUtaXRlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nYXBzL3Njb3BlLWl0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFHYixJQUFZLFFBQVEsV0FBTSxhQUFhLENBQUMsQ0FBQTtBQUN4Qyw0QkFBa0IsdUJBQXVCLENBQUMsQ0FBQTtBQUkxQztJQUF3Qyw4QkFBRztJQUEzQztRQUF3Qyw4QkFBRztRQUUxQyxTQUFJLEdBQVcsV0FBVyxDQUFDO0lBZ0I1QixDQUFDO0lBZE8sZ0JBQUssR0FBWixVQUFhLElBQWM7UUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNiLENBQUM7O0lBRUQsMkJBQU0sR0FBTixVQUFPLE9BQW1CLEVBQUUsSUFBUztRQUNwQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNqRSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO1FBQ3hDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUEsQ0FBQztZQUNmLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBQUEsQ0FBQztRQUNGLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7O0lBRUYsaUJBQUM7QUFBRCxDQUFDLEFBbEJELENBQXdDLGlCQUFHLEdBa0IxQztBQWxCRDs0QkFrQkMsQ0FBQTtBQUFBLENBQUMifQ==