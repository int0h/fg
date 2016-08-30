"use strict";
var utils = require('./utils');
;
;
/**
 * Reads path and returns parsed path.
 * @param {string[]} parts - array of path's parts.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
function read(parts, extraInfo) {
    var source = "data";
    var path = parts.map(function (part) {
        if (part[0] === '$') {
            return {
                op: part.slice(1)
            };
        }
        ;
        return part;
    });
    var res = {
        "source": source,
        "path": null,
        "rawPath": path,
        "escaped": true
    };
    if (extraInfo) {
        utils.extend(res, extraInfo);
    }
    ;
    return res;
}
exports.read = read;
;
/**
 * Parses dot path and returns parsed path.
 * @param {string} str - text of the path separated by dots.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
function parse(str, extraInfo) {
    var parts = str.trim().split('.');
    return read(parts, extraInfo);
}
exports.parse = parse;
;
/**
 * Finds the nearest scope and return its path.
 * @param {Object} meta - gap meta connected to the path.
 * @returns {Object} scope path object.
 */
function findScopePath(meta) {
    var parent = meta.parent;
    while (true) {
        if (!parent) {
            return [];
        }
        ;
        if (parent.scopePath) {
            return parent.scopePath;
        }
        ;
        parent = parent.parent;
    }
    ;
}
;
/**
 * Resolves the path removing all operators from path (e.g. $up).
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} path - value path object.
 * @returns {Object} resolved path object.
 */
function resolvePath(meta, path) {
    var scopePath = findScopePath(meta);
    var res = {
        path: null,
        rawPath: path.rawPath,
        source: "data",
        escaped: path.escaped
    };
    res.path = scopePath.slice();
    path.rawPath.forEach(function (key) {
        if (typeof key === "string") {
            res.path.push(key);
            return;
        }
        ;
        if (key.op === "root") {
            res.path = [];
        }
        else if (key.op === "up") {
            res.path.pop();
        }
        ;
    });
    return res;
}
exports.resolvePath = resolvePath;
;
/**
 * Returns the value by given path.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} valuePath - value path to be fetched.
 * @returns {any} fetched data.
 */
function getValue(meta, data, valuePath) {
    var sourceTable = {
        "data": data,
        "meta": meta
    };
    var sourceData = sourceTable[valuePath.source];
    var res = utils.objPath(valuePath.path, sourceData);
    if (valuePath.escaped) {
        res = utils.escapeHtml(res);
    }
    ;
    return res;
}
exports.getValue = getValue;
;
/**
 * Returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} resolvedPath - resolved path.
 * @returns {string} rendered string.
 */
function render(meta, data, resolvedPath) {
    return getValue(meta, data, resolvedPath).toString();
}
exports.render = render;
;
/**
 * Resolve path and returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} path - unresolved path.
 * @returns {string} rendered string.
 */
function resolveAndRender(meta, data, path) {
    var resolvedPath = resolvePath(meta, path);
    return render(meta, data, resolvedPath);
}
exports.resolveAndRender = resolveAndRender;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsdWVNZ3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdmFsdWVNZ3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsSUFBWSxLQUFLLFdBQU0sU0FBUyxDQUFDLENBQUE7QUFJaEMsQ0FBQztBQU9ELENBQUM7QUFFRjs7Ozs7R0FLRztBQUNILGNBQXFCLEtBQW9CLEVBQUUsU0FBa0I7SUFDNUQsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3BCLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBUyxJQUFJO1FBQ2pDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQSxDQUFDO1lBQ3BCLE1BQU0sQ0FBQztnQkFDTixFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDakIsQ0FBQztRQUNILENBQUM7UUFBQSxDQUFDO1FBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNiLENBQUMsQ0FBQyxDQUFDO0lBQ0gsSUFBSSxHQUFHLEdBQUc7UUFDVCxRQUFRLEVBQUUsTUFBTTtRQUNoQixNQUFNLEVBQUUsSUFBSTtRQUNaLFNBQVMsRUFBRSxJQUFJO1FBQ2YsU0FBUyxFQUFFLElBQUk7S0FDZixDQUFDO0lBQ0YsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUEsQ0FBQztRQUNkLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFwQmUsWUFBSSxPQW9CbkIsQ0FBQTtBQUFBLENBQUM7QUFFRjs7Ozs7R0FLRztBQUNILGVBQXNCLEdBQVcsRUFBRSxTQUFrQjtJQUNwRCxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FB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