"use strict";

var fs = require('fs');

export interface IToJsOpts{
	tab?: string;
	n?: string;
};

export function toJs(obj: any, opts: IToJsOpts = {}, tabOffest?: number): string{
	opts.tab = opts.tab || '\t';
	opts.n = opts.n || '\n';
	tabOffest = tabOffest || 0;
	let tabPrefix = '';
	for (let i = 0; i < tabOffest; i++){
		tabPrefix += opts.tab;
	};	
	if (obj === null){
		return "null";
	};
	if (["string", "number", "boolean"].indexOf(typeof obj) >= 0){
		return JSON.stringify(obj);
	};
	if (typeof obj === "function"){
		let code = obj.toString();
		const lines: string[] = code.split(opts.n);
		code = lines.slice(0, 1).concat(
				lines.slice(1).map(strPrefix.bind(null, tabPrefix)) as string[]
			)
			.join(opts.n);
		return code;
	};
	if (typeof obj === "object"){
		let codeParts: string[];
		if (Array.isArray(obj)){
			codeParts = obj.map(function(val: any){
				return tabPrefix + opts.tab + toJs(val, opts, tabOffest + 1);
			});
			return '[' + opts.n + codeParts.join(',' + opts.n) + opts.n + tabPrefix + ']';
		};
		codeParts = [];
		for (let key in obj){
			if (obj[key] === undefined){
				continue;
			};
			codeParts.push(tabPrefix + opts.tab + '"' + key + '": ' + toJs(obj[key], opts, tabOffest + 1));
		};		
		return '{' + opts.n + codeParts.join(',' + opts.n) + opts.n + tabPrefix + '}';
	};
};

export function strPrefix(prefix: string, str: string): string{
	return prefix + str;
};

export function prefixLines(str: string, prefix: string, triggerFn: Function): string{
	const lines = str.split('\n').map(function(line, id){
		if (!triggerFn || triggerFn(line, id, lines)){
			return prefix + line;
		};
		return line;
	});
	return lines.join('\n');
};

export function fileExist(path: string): boolean{
	try{
		fs.accessSync(path);
	}catch(e){
		return false;
	};
	return true;
};

export function forTree(treeObj: any, childProp: string, fn: Function){
	fn(treeObj);
	if (treeObj[childProp]){
		treeObj[childProp].forEach(function(node: any){
			forTree(node, childProp, fn);
		});
	};
};

export function getSubFolders(path: string): string[]{
	return fs.readdirSync(path).filter(function(subPath: string){
		const stat = fs.statSync(path + '/' + subPath);
		return stat.isDirectory();
	});
};

export function treeMap(treeObj: any, childProp: string, fn: Function): any{
    let res: any = {};
	res = fn(treeObj);
	if (treeObj[childProp]){
		treeObj[childProp].forEach(function(node: any, id: number){
			res[childProp][id] = treeMap(node, childProp, fn);
		});
	};
	return res;
};