"use strict";

import * as valueMgr from './valueMgr';
import {IAstNode} from './tplMgr';
export * from './utils/tplUtils';

export function objFor(obj: any, fn: Function){
	for (var i in obj){
		fn(obj[i], i, obj);
	};
};

export function objMap(obj: Object, fn: Function): any{
	let newObj: any = {};
	objFor(obj, function(item: any, id: string){
		const newItem = fn(item, id, obj);
		newObj[id] = newItem;
	});
	return newObj;
};

export function objPath(path: Array<string>, obj: any, newVal?: any): any{
	if (path.length < 1){
		if (arguments.length > 2){
			throw 'root rewritting is not supported';
		};
		return obj;
	};
	const propName = path[0];
	if (path.length === 1){
		if (arguments.length > 2){
			obj[propName] = newVal; 
		};				
		return obj[propName];	
	};
	const subObj = obj[propName];
	if (subObj === undefined){
		//throw new Error("Cannot read " + propName + " of undefined");
		return undefined; // throw?
	};		
	if (arguments.length > 2){
		return objPath(path.slice(1), subObj, newVal);
	};
	return objPath(path.slice(1), subObj);
};

export function simpleClone(obj: any): any{
	let res: any = {};
	for (var i in obj){
		res[i] = obj[i];
	};
	return res;
};

export function keyValueToObj(arr: any[], keyName: string, valueName: string): any{
	keyName = keyName || 'key';
	valueName = valueName || 'value';
	let res: any = {};
	arr.forEach(function(i){
		res[i[keyName]] = i[valueName];
	}); 
	return res;
};

export function objToKeyValue(obj: any, keyName: string, valueName: string): any[]{
	keyName = keyName || 'key';
	valueName = valueName || 'value';
	let res: any[] = [];
	for (var i in obj){
		let item: any = {};
		item[keyName] = i;
		item[valueName] = obj[i];
		res.push(item);
	};
	return res;
};

export function concatObj(obj1: any, obj2: any): any{
	let res = simpleClone(obj1);
	for (let i in obj2){
		res[i] = obj2[i];
	};
	return res;
};

export function extend(dest: any, src: any): any{	
	for (let i in src){
		dest[i] = src[i];
	};
	return dest;
};

export function parsePath(parsedNode: IAstNode): valueMgr.IValuePath{
	if (parsedNode.attrs.class){
		const parts = parsedNode.attrs.class.value.split(' ');
		const parsed = valueMgr.read(parts);
		return parsed;
	};
	return valueMgr.read([]);
};

export function deepClone(obj: Object): Object{
	if (typeof obj === "object"){
		const map = Array.isArray(obj)
			? obj.map.bind(obj)
			: objMap.bind(null, obj);
		return map(deepClone);
	};
	return obj;
};

export function escapeHtml(code: string): string{
	return code
		.replace(/"/g,'&quot;')
		.replace(/&/g,'&amp;')
		.replace(/</g,'&lt;')
		.replace(/>/g,'&gt;');
};