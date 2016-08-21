"use strict";

var utils = require('fg-js/utils');

/**
 * Reads path and returns parsed path.
 * @param {string[]} parts - array of path's parts.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
function read(parts, extraInfo){
	var source = "data";
	var path = parts.map(function(part){		
		if (part[0] === '$'){
			return {
				op: part.slice(1)
			};
		};
		return part; 
	});
	var res = {
		"source": source,
		"path": path
	};
	if (extraInfo){
		utils.extend(res, extraInfo);
	};
	return res;
};
exports.read = read;

/**
 * Parses dot path and returns parsed path.
 * @param {string} str - text of the path separated by dots.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
function parse(str, extraInfo){
	var parts = str.trim().split('.');
	return read(parts, extraInfo);
};
exports.parse = parse;

/**
 * Finds the nearest scope and return its path.
 * @param {Object} meta - gap meta connected to the path.
 * @returns {Object} scope path object.
 */
function findScopePath(meta){
	var parent = meta.parent;
	while (true){		
		if (!parent){
			return [];
		};
		if (parent.scopePath){
			return parent.scopePath;
		};
		parent = parent.parent;
	};
};

/**
 * Resolves the path removing all operators from path (e.g. $up).
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} path - value path object.
 * @returns {Object} resolved path object.
 */
function resolvePath(meta, path){
	var scopePath = findScopePath(meta);
	var res = {
		source: "data",
		escaped: path.escaped
	};
	res.path = scopePath.slice();
	path.path.forEach(function(key){
		if (typeof key === "string"){
			res.path.push(key);			
			return;
		};
		if (key.op === "root"){
			res.path = [];
		} else if (key.op === "up"){
			res.path.pop();
		};
	});
	return res;
};
exports.resolvePath = resolvePath;

/**
 * Returns the value by given path.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} valuePath - value path to be fetched.
 * @returns {any} fetched data.
 */
function getValue(meta, data, valuePath){
	var sourceTable = {
		"data": data,
		"meta": meta
	};
	var sourceData = sourceTable[valuePath.source];
	var res = utils.objPath(valuePath.path, sourceData);
	if (valuePath.escaped){
		res = utils.escapeHtml(res);		
	};
	return res;
};
exports.getValue = getValue;

/**
 * Returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} resolvedPath - resolved path.
 * @returns {string} rendered string.
 */
function render(meta, data, resolvedPath){
	return getValue(meta, data, resolvedPath).toString();
};
exports.render = render;

/**
 * Resolve path and returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} path - unresolved path.
 * @returns {string} rendered string.
 */
function resolveAndRender(meta, data, path){
	var resolvedPath = resolvePath(meta, path);
	return render(meta, data, resolvedPath);
};
exports.resolveAndRender = resolveAndRender;
