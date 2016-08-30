"use strict";
var tplMgr = require('./tplMgr');
var microJade = require('micro-jade');
;
;
/**
 * Fragment Manager. Stores all parsed fg's.
 * @constructor
 */
var FgMgr = (function () {
    function FgMgr() {
        this.fgs = {};
    }
    ;
    /**
     * Reads fragment from object.
     * @constructor
     * @param {string} name - Name of fg.
     * @param {object} sources - Sources for fg like tpl or logic files.
     */
    FgMgr.prototype.readFg = function (name, sources) {
        var jadeCode = sources.tpl;
        var mjAst = microJade.parse(jadeCode);
        var tpl = tplMgr.readTpl(mjAst);
        var classFn;
        if (sources.classFn) {
            var code = sources.classFn;
            classFn = new Function('fgClass', 'fgProto', code);
        }
        ;
        this.fgs[name] = {
            "tpl": tpl,
            "name": name,
            "classFn": classFn
        };
    };
    ;
    return FgMgr;
}());
exports.FgMgr = FgMgr;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmdNZ3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZmdNZ3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsSUFBWSxNQUFNLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbkMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBTXJDLENBQUM7QUFJRCxDQUFDO0FBRUY7OztHQUdHO0FBQ0g7SUFHQztRQUNDLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2YsQ0FBQzs7SUFFRDs7Ozs7T0FLRztJQUNILHNCQUFNLEdBQU4sVUFBTyxJQUFJLEVBQUUsT0FBTztRQUNuQixJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQzNCLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEMsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxJQUFJLE9BQU8sQ0FBQztRQUNaLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQSxDQUFDO1lBQ3BCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDM0IsT0FBTyxHQUFHLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHO1lBQ2hCLEtBQUssRUFBRSxHQUFHO1lBQ1YsTUFBTSxFQUFFLElBQUk7WUFDWixTQUFTLEVBQUUsT0FBTztTQUNsQixDQUFDO0lBQ0gsQ0FBQzs7SUFFRixZQUFDO0FBQUQsQ0FBQyxBQTdCRCxJQTZCQztBQTdCWSxhQUFLLFFBNkJqQixDQUFBO0FBQUEsQ0FBQyJ9