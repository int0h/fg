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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGUtaXRlbS4xLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2dhcHMvc2NvcGUtaXRlbS4xLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBR2IsSUFBWSxRQUFRLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDeEMsNEJBQWtCLHVCQUF1QixDQUFDLENBQUE7QUFJMUM7SUFBd0MsOEJBQUc7SUFBM0M7UUFBd0MsOEJBQUc7SUFpQjNDLENBQUM7SUFkTyxnQkFBSyxHQUFaLFVBQWEsSUFBYztRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQzs7SUFFRCwyQkFBTSxHQUFOLFVBQU8sT0FBbUIsRUFBRSxJQUFTO1FBQ3BDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2pFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDeEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQSxDQUFDO1lBQ2YsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFBQSxDQUFDO1FBQ0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQzs7SUFFRixpQkFBQztBQUFELENBQUMsQUFqQkQsQ0FBd0MsaUJBQUcsR0FpQjFDO0FBakJEOzRCQWlCQyxDQUFBO0FBQUEsQ0FBQyJ9