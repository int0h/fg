"use strict";
var utils = require('./utils');
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
        // if (part[0] === '$'){
        // 	return {
        // 		op: part.slice(1)
        // 	};
        // };
        return part;
    });
    var res = {
        "source": source,
        "path": path,
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
        source: "data",
        escaped: path.escaped
    };
    res.path = scopePath.slice();
    path.path.forEach(function (key) {
        if (typeof key[0] !== "$") {
            res.path.push(key);
            return;
        }
        ;
        if (key === "$root") {
            res.path = [];
        }
        else if (key === "$up") {
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
    var text = getValue(meta, data, resolvedPath).toString();
    if (resolvedPath.escaped) {
        text = utils.escapeHtml(text);
    }
    ;
    return text;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsdWVNZ3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdmFsdWVNZ3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsSUFBWSxLQUFLLFdBQU0sU0FBUyxDQUFDLENBQUE7QUFRaEMsQ0FBQztBQUVGOzs7OztHQUtHO0FBQ0gsY0FBcUIsS0FBb0IsRUFBRSxTQUFrQjtJQUM1RCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDcEIsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFTLElBQUk7UUFDakMsd0JBQXdCO1FBQ3hCLFlBQVk7UUFDWixzQkFBc0I7UUFDdEIsTUFBTTtRQUNOLEtBQUs7UUFDTCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLENBQUM7SUFDSCxJQUFJLEdBQUcsR0FBZTtRQUNyQixRQUFRLEVBQUUsTUFBTTtRQUNoQixNQUFNLEVBQUUsSUFBSTtRQUNaLFNBQVMsRUFBRSxJQUFJO0tBQ2YsQ0FBQztJQUNGLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFBLENBQUM7UUFDZCxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBQUEsQ0FBQztJQUNGLE1BQU0sQ0FBQyxHQUFHLENBQUM7QUFDWixDQUFDO0FBbkJlLFlBQUksT0FtQm5CLENBQUE7QUFBQSxDQUFDO0FBRUY7Ozs7O0dBS0c7QUFDSCxlQUFzQixHQUFXLEVBQUUsU0FBa0I7SUFDcEQsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBSGUsYUFBSyxRQUdwQixDQUFBO0FBQUEsQ0FBQztBQUVGOzs7O0dBSUc7QUFDSCx1QkFBdUIsSUFBUztJ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