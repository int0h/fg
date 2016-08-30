"use strict";
var utils = require('../utils');
var TreeHelper = require('fg-js/utils/treeHelper.js');
function initNodeFn() {
    return {
        gaps: []
    };
}
;
var GapStorage = (function () {
    function GapStorage(context) {
        this.context = context;
        this.gaps = [];
        this.scopeTree = new TreeHelper({
            kind: 'dict',
            initNode: initNodeFn
        });
        this.eidDict = {};
    }
    ;
    GapStorage.prototype.setScopeTrigger = function (gap, scopePath) {
        var scope = this.scopeTree.access(scopePath);
        scope.data.gaps.push(gap);
    };
    ;
    GapStorage.prototype.setTriggers = function (gap, scopeTriggers) {
        scopeTriggers.forEach(this.setScopeTrigger.bind(this, gap));
    };
    ;
    GapStorage.prototype.reg = function (gap) {
        var eid = gap.eid;
        if (eid) {
            this.eidDict[eid] = this.eidDict[eid] || [];
            this.eidDict[eid].push(gap);
        }
        ;
        var gid = this.getGid();
        gap.gid = gid;
        if (!gap.isVirtual) {
            gap.attrs = utils.simpleClone(gap.attrs || {});
            gap.attrs.id = ["fg", this.context.id, "gid", gid].join('-');
        }
        ;
        gap.storageId = this.gaps.length;
        this.gaps.push(gap);
    };
    ;
    GapStorage.prototype.assign = function () {
        this.gaps.forEach(function (gapMeta) {
            if (gapMeta.type !== "root" && gapMeta.fg) {
                gapMeta.fg.assign();
            }
            ;
        });
        return;
    };
    ;
    GapStorage.prototype.byScope = function (scopePath, targetOnly) {
        var scope = this.scopeTree.access(scopePath);
        var subNodes = [];
        if (scope.childCount !== 0 && !targetOnly) {
            subNodes = scope.getDeepChildArr().map(function (node) {
                return {
                    gaps: node.data.gaps,
                    path: node.path
                };
            });
        }
        ;
        var parents = scope.getParents();
        return {
            target: scope.data.gaps,
            subs: subNodes,
            parents: parents
        };
    };
    ;
    GapStorage.prototype.removeScope = function (scopePath) {
        var scope = this.byScope(scopePath);
        var removedDomGaps = scope.target;
        var removedGaps = scope.target;
        scope.subs.forEach(function (node) {
            removedGaps = removedGaps.concat(node.gaps);
        });
        this.scopeTree.remove(scopePath);
        this.gaps = this.gaps.filter(function (gap) {
            return removedGaps.indexOf(gap) < 0;
        });
        removedDomGaps.forEach(function (gap) {
            gap.removeDom();
        });
    };
    ;
    GapStorage.prototype.byEid = function (eid) {
        return this.eidDict[eid];
    };
    ;
    GapStorage.prototype.getGid = function () {
        return this.gaps.length;
    };
    ;
    return GapStorage;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GapStorage;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2FwU3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jbGllbnQvR2FwU3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixJQUFZLEtBQUssV0FBTSxVQUFVLENBQUMsQ0FBQTtBQUdsQyxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQUV0RDtJQUNDLE1BQU0sQ0FBQztRQUNOLElBQUksRUFBRSxFQUFFO0tBQ1IsQ0FBQztBQUNILENBQUM7QUFBQSxDQUFDO0FBRUY7SUFNQyxvQkFBWSxPQUFtQjtRQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxVQUFVLENBQUM7WUFDL0IsSUFBSSxFQUFFLE1BQU07WUFDWixRQUFRLEVBQUUsVUFBVTtTQUNwQixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDOztJQUVELG9DQUFlLEdBQWYsVUFBZ0IsR0FBUSxFQUFFLFNBQVM7UUFDbEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDN0MsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLENBQUM7O0lBRUQsZ0NBQVcsR0FBWCxVQUFZLEdBQVEsRUFBRSxhQUFhO1FBQ2xDLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDN0QsQ0FBQzs7SUFFRCx3QkFBRyxHQUFILFVBQUksR0FBUTtRQUNYLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENB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