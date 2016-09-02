"use strict";
var utils = require('../utils');
var TreeHelper_1 = require('../utils/TreeHelper');
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
        this.scopeTree = TreeHelper_1.default({
            kind: 'dict',
            initTreeNode: initNodeFn
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2FwU3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jbGllbnQvR2FwU3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixJQUFZLEtBQUssV0FBTSxVQUFVLENBQUMsQ0FBQTtBQUdsQywyQkFBdUIscUJBQXFCLENBQUMsQ0FBQTtBQUU3QztJQUNDLE1BQU0sQ0FBQztRQUNOLElBQUksRUFBRSxFQUFFO0tBQ1IsQ0FBQztBQUNILENBQUM7QUFBQSxDQUFDO0FBRUY7SUFNQyxvQkFBWSxPQUFtQjtRQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsb0JBQVUsQ0FBQztZQUMzQixJQUFJLEVBQUUsTUFBTTtZQUNaLFlBQVksRUFBRSxVQUFVO1NBQ3hCLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLENBQUM7O0lBRUQsb0NBQWUsR0FBZixVQUFnQixHQUFRLEVBQUUsU0FBUztRQUNsQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM3QyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDM0IsQ0FBQzs7SUFFRCxnQ0FBVyxHQUFYLFVBQVksR0FBUSxFQUFFLGFBQWE7UUFDbEMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDOztJQUVELHdCQUFHLEdBQUgsVUFBSSxHQUFRO1FBQ1gsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQztRQUNsQixFQUFFLENBQUMsQ0FB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