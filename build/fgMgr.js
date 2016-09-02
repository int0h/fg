"use strict";
var tplMgr = require('./tplMgr');
var microJade = require('micro-jade');
;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmdNZ3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZmdNZ3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsSUFBWSxNQUFNLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbkMsSUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBTXZDLENBQUM7QUFNRCxDQUFDO0FBSUQsQ0FBQztBQUVGOzs7R0FHRztBQUNIO0lBR0M7UUFDQyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNmLENBQUM7O0lBRUQ7Ozs7O09BS0c7SUFDSCxzQkFBTSxHQUFOLFVBQU8sSUFBWSxFQUFFLE9BQXVCO1FBQzNDLElBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDN0IsSUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4QyxJQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLElBQUksT0FBaUIsQ0FBQztRQUN0QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUEsQ0FBQztZQUNwQixJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQzdCLE9BQU8sR0FBRyxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRztZQUNoQixLQUFLLEVBQUUsR0FBRztZQUNWLE1BQU0sRUFBRSxJQUFJO1lBQ1osU0FBUyxFQUFFLE9BQU87U0FDbEIsQ0FBQztJQUNILENBQUM7O0lBRUYsWUFBQztBQUFELENBQUMsQUE3QkQsSUE2QkM7QUE3QlksYUFBSyxRQTZCakIsQ0FBQTtBQUFBLENBQUMifQ==