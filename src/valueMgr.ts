"use strict";

import * as utils from './utils';
import {IGapData, IScopeTable, Gap} from './client/gapClassMgr';

export type IValuePathItem = string;

export type IPath = IValuePathItem[];

export interface IDataQuery {
    path: IPath;
	source: string;
	escaped: boolean;
};

export type IDataPath = string[]; 

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
	const res: IDataQuery = {
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

export function calcPath(gap: Gap, dataSource: IDataQuery): IDataQuery{
	let idList: number[] = [];
	let cur = gap;
	while (cur){
		if ("scopeId" in cur){
			idList.push((cur as any).scopeId as number);
		};
		cur = cur.parent;
	};
	idList.reverse();
	const newPath = dataSource.path.map((part, id) => {
		if (part === "*"){
			return idList.toString();
		};
		return part;
	}); 
	return {
		escaped: dataSource.escaped,
		source: dataSource.source,
		path: newPath
	};
};

function getScopeTable(parents: IGapData[]): IScopeTable{
	let res: IScopeTable = {};
	parents.forEach(function(parent: IGapData){
		if (parent.scope){
			res[parent.scope.name] = parent.scope.path;
		};
	});
	return res;
};

function relativePath(fromPath: IPath, path: IPath): IPath{
	var resPath = fromPath.slice();
	path.forEach(function(part){
		if (part === "^"){
			resPath.pop();
			return; 
		};
		resPath.push(part);
	});
	return resPath;
};

export function resolveDataPath(path: IPath, parents: IGapData[]): IPath{
	const firstPart = path[0];
	if (firstPart && firstPart[0] === "$"){
		const scopeName = firstPart.slice(1); 
		const scopeTable = getScopeTable(parents);		
		const scopePath = scopeTable[scopeName];
		if (!scopePath){
			throw new Error("Scope [" + scopeName + "] not found!");
		};
		const scopeItemPath = scopePath.concat(['*']);
		return relativePath(scopeItemPath, path.slice(1));
	};
	return path;
};

/**
 * Resolves the path removing all operators from path (e.g. $up).
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} path - value path object.
 * @returns {Object} resolved path object.
 */
export function resolvePath(dataQuery: IDataQuery, parents: IGapData[]): IDataQuery{
	let res: IDataQuery = {
		path: null,
		source: dataQuery.source,
		escaped: dataQuery.escaped
	};
	res.path = resolveDataPath(dataQuery.path, parents);
	return res;
};

/**
 * Returns the value by given path.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} valuePath - value path to be fetched.
 * @returns {any} fetched data.
 */
export function getValue(gap: Gap, data: Object, valuePath: IDataQuery): any{
	const sourceTable: any = {
		"data": data,
		"meta": gap
	};
	const sourceData: string = sourceTable[valuePath.source];
	const realPath = calcPath(gap, valuePath);
	const res = utils.objPath(realPath.path, sourceData);
	return res;
};

/**
 * Returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} resolvedPath - resolved path.
 * @returns {string} rendered string.
 */
export function render(gap: Gap, data: Object, dataSource: IDataQuery): string{
	const value = getValue(gap, data, dataSource);
	if (value === undefined){
		throw new Error("Cannot render: [" + dataSource.path.join('.') + "] is undefined!");
	};
	let text = value.toString(); 
	if (dataSource.escaped){
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
// export function resolveAndRender(meta: IGapData, data: Object, path: IDataQuery, parents: IGapData[]){
// 	var resolvedPath = resolvePath(path, parents);
// 	return render(meta, data, resolvedPath);
// };