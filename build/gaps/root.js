"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var gapClassMgr_1 = require('../client/gapClassMgr');
var GRoot = (function (_super) {
    __extends(GRoot, _super);
    function GRoot() {
        _super.apply(this, arguments);
        this.type = "root";
    }
    GRoot.parse = function (node) {
        return null;
    };
    ;
    GRoot.prototype.render = function (context, data) {
        throw new Error('root gap should not be rendered');
    };
    ;
    return GRoot;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GRoot;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nYXBzL3Jvb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFJYiw0QkFBa0IsdUJBQXVCLENBQUMsQ0FBQTtBQUkxQztJQUFtQyx5QkFBRztJQUF0QztRQUFtQyw4QkFBRztRQUVyQyxTQUFJLEdBQVcsTUFBTSxDQUFDO0lBVXZCLENBQUM7SUFSTyxXQUFLLEdBQVosVUFBYSxJQUFjO1FBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELHNCQUFNLEdBQU4sVUFBTyxPQUFtQixFQUFFLElBQVM7UUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7O0lBRUYsWUFBQztBQUFELENBQUMsQUFaRCxDQUFtQyxpQkFBRyxHQVlyQztBQVpEO3VCQVlDLENBQUE7QUFBQSxDQUFDIn0=