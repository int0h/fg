"use strict";

import * as utils from './utils';

export type IValuePathItem = string;

export type IPath = IValuePathItem[];

export interface IDataQuery {
    path: IPath;
	source: string;
	escaped: boolean;
	scopeName: string;
};

export interface IScope{
	path: IPath;
	name: string;	
};

interface IScopeSet{
	[key: string]: IPath;
};

/**
 * Reads path and returns parsed path.
 * @param {string[]} parts - array of path's parts.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
export function read(parts: Array<string>, extraInfo?: Object): IDataQuery{
	let source = "data";
	const first = parts[0];
	let path = parts;
	let scopeName: string = null;
	if (/^[\$]/.test(first)){
		path = path.slice(1);
		if (first[0] === "$"){
			source = "scope";
			scopeName = first.slice(1); 			
		};
	};
	const res: IDataQuery = {
		"source": source,
		"path": path,
		"escaped": true,
		"scopeName": scopeName
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
export function parse(str: string, extraInfo?: Object): IDataQuery{
	const parts = str.trim().split('.');
	return read(parts, extraInfo);
};

/**
 * Finds the nearest scope and return its path.
 * @param {Object} meta - gap meta connected to the path.
 * @returns {Object} scope path object.
 */
function findScopes(meta: any): IScopeSet{
	let parent = meta.parent;
	let scopeObj: IScopeSet = {
		"root": []
	};
	while (true){		
		if (!parent){
			return scopeObj;
		};
		if (parent.scope){
			const scopeName = parent.scope.name;			
			if (!(scopeName in scopeObj)){
				scopeObj[scopeName] = parent.scope.path;
			};
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
export function resolvePath(meta: any, dataQuery: IDataQuery): IDataQuery{
	const scopeSet = findScopes(meta);
	let res: IDataQuery = {
		path: null,
		source: dataQuery.source,
		escaped: dataQuery.escaped,
		scopeName: dataQuery.scopeName
	};
	let curScopePath: IPath; 
	if (dataQuery.source === "scope"){
		curScopePath = scopeSet[dataQuery.scopeName];
	}else{
		const defaultScope = scopeSet[''];
		curScopePath = defaultScope
			? defaultScope
			: []; 
	};
	res.path = curScopePath.slice();		
	dataQuery.path.forEach(function(key){
		if (typeof key[0] !== "^"){
			res.path.push(key);			
			return;
		};
		if (key === "^"){
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
export function getValue(meta: any, data: Object, valuePath: IDataQuery): any{
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
export function render(meta: any, data: Object, resolvedPath: IDataQuery): string{
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
export function resolveAndRender(meta: any, data: Object, path: IDataQuery){
	var resolvedPath = resolvePath(meta, path);
	return render(meta, data, resolvedPath);
};