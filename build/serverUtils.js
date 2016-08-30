"use strict";
var fs = require('fs');
function toJs(obj, opts, tabOffest) {
    opts = opts || {};
    opts.tab = opts.tab || '\t';
    opts.n = opts.n || '\n';
    tabOffest = tabOffest || 0;
    var tabPrefix = '';
    for (var i = 0; i < tabOffest; i++) {
        tabPrefix += opts.tab;
    }
    ;
    if (obj === null) {
        return "null";
    }
    ;
    if (["string", "number", "boolean"].indexOf(typeof obj) >= 0) {
        return JSON.stringify(obj);
    }
    ;
    if (typeof obj === "function") {
        var code = obj.toString();
        var lines = code
            .split(opts.n);
        code = lines.slice(0, 1).concat(lines.slice(1)
            .map(strPrefix.bind(null, tabPrefix)))
            .join(opts.n);
        return code;
    }
    ;
    if (typeof obj === "object") {
        var codeParts;
        if (Array.isArray(obj)) {
            codeParts = obj.map(function (val) {
                return tabPrefix + opts.tab + toJs(val, opts, tabOffest + 1);
            });
            return '[' + opts.n + codeParts.join(',' + opts.n) + opts.n + tabPrefix + ']';
        }
        ;
        codeParts = [];
        for (var key in obj) {
            if (obj[key] === undefined) {
                continue;
            }
            ;
            codeParts.push(tabPrefix + opts.tab + '"' + key + '": ' + toJs(obj[key], opts, tabOffest + 1));
        }
        ;
        return '{' + opts.n + codeParts.join(',' + opts.n) + opts.n + tabPrefix + '}';
    }
    ;
}
exports.toJs = toJs;
;
function strPrefix(prefix, str) {
    return prefix + str;
}
exports.strPrefix = strPrefix;
;
function prefixLines(str, prefix, triggerFn) {
    var lines = str.split('\n').map(function (line, id) {
        if (!triggerFn || triggerFn(line, id, lines)) {
            return prefix + line;
        }
        ;
        return line;
    });
    return lines.join('\n');
}
exports.prefixLines = prefixLines;
;
function fileExist(path) {
    try {
        fs.accessSync(path);
    }
    catch (e) {
        return false;
    }
    ;
    return true;
}
exports.fileExist = fileExist;
;
function forTree(treeObj, childProp, fn) {
    fn(treeObj);
    if (treeObj[childProp]) {
        treeObj[childProp].forEach(function (node) {
            forTree(node, childProp, fn);
        });
    }
    ;
}
exports.forTree = forTree;
;
function getSubFolders(path) {
    return fs.readdirSync(path).filter(function (subPath) {
        var stat = fs.statSync(path + '/' + subPath);
        return stat.isDirectory();
    });
}
exports.getSubFolders = getSubFolders;
;
function treeMap(treeObj, childProp, fn) {
    var res = {};
    res = fn(treeObj);
    if (treeObj[childProp]) {
        treeObj[childProp].forEach(function (node, id) {
            res[childProp][id] = treeMap(node, childProp, fn);
        });
    }
    ;
    return res;
}
exports.treeMap = treeMap;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyVXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc2VydmVyVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRXZCLGNBQXFCLEdBQUcsRUFBRSxJQUFLLEVBQUUsU0FBVTtJQUMxQyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUNsQixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDO0lBQzVCLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDeEIsU0FBUyxHQUFHLFNBQVMsSUFBSSxDQUFDLENBQUM7SUFDM0IsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ25CLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFDLENBQUM7UUFDbkMsU0FBUyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUM7SUFDdkIsQ0FBQztJQUFBLENBQUM7SUFDRixFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUEsQ0FBQztRQUNqQixNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUFBLENBQUM7SUFDRixFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsQ0FBQztRQUM3RCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBQUEsQ0FBQztJQUNGLEVBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBRyxLQUFLLFVBQVUsQ0FBQyxDQUFBLENBQUM7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