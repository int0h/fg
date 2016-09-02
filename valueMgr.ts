"use strict";

import * as utils from './utils';

export type IValuePathItem = string;

export interface IValuePath {
    path: Array<IValuePathItem>;
	source: string;
	escaped: boolean;
};

/**
 * Reads path and returns parsed path.
 * @param {string[]} parts - array of path's parts.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
export function read(parts: Array<string>, extraInfo?: Object): IValuePath{
	let source = "data";
	let path = parts.map(function(part){		
		// if (part[0] === '$'){
		// 	return {
		// 		op: part.slice(1)
		// 	};
		// };
		return part; 
	});
	const res: IValuePath = {
		"source": source,
		"path": path,
		"escaped": true
	};
	if (extraInfo){
		utils.extend(res, extraInfo);
	};
	return res;
};

/**
 * Parses dot path and returns parsed path.
 * @param {string} str - text of the path separated by dots.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
export function parse(str: string, extraInfo?: Object): IValuePath{
	const parts = str.trim().split('.');
	return read(parts, extraInfo);
};

/**
 * Finds the nearest scope and return its path.
 * @param {Object} meta - gap meta connected to the path.
 * @returns {Object} scope path object.
 */
function findScopePath(meta: any){
	let parent = meta.parent;
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
export function resolvePath(meta: any, path: IValuePath): IValuePath{
	const scopePath = findScopePath(meta);
	let res: IValuePath = {
		path: null,
		source: "data",
		escaped: path.escaped
	};
	res.path = scopePath.slice();
	path.path.forEach(function(key){
		if (typeof key[0] !== "$"){
			res.path.push(key);			
			return;
		};
		if (key === "$root"){
			res.path = [];
		} else if (key === "$up"){
			res.path.pop();
		};
	});
	return res;
};

/**
 * Returns the value by given path.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} valuePath - value path to be fetched.
 * @returns {any} fetched data.
 */
export function getValue(meta: any, data: Object, valuePath: IValuePath): any{
	const sourceTable: any = {
		"data": data,
		"meta": meta
	};
	const sourceData: string = sourceTable[valuePath.source];
	const res = utils.objPath(valuePath.path, sourceData);
	return res;
};

/**
 * Returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} resolvedPath - resolved path.
 * @returns {string} rendered string.
 */
export function render(meta: any, data: Object, resolvedPath: IValuePath): string{
	var text = getValue(meta, data, resolvedPath).toString(); 
	if (resolvedPath.escaped){
		text = utils.escapeHtml(text);		
	};
	return text;
};

/**
 * Resolve path and returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} path - unresolved path.
 * @returns {string} rendered string.
 */
export function resolveAndRender(meta: any, data: Object, path: IValuePath){
	var resolvedPath = resolvePath(meta, path);
	return render(meta, data, resolvedPath);
};