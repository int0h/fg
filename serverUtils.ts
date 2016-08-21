"use strict";

var fs = require('fs');

export function toJs(obj, opts?, tabOffest?){
	opts = opts || {};
	opts.tab = opts.tab || '\t';
	opts.n = opts.n || '\n';
	tabOffest = tabOffest || 0;
	var tabPrefix = '';
	for (var i = 0; i < tabOffest; i++){
		tabPrefix += opts.tab;
	};	
	if (obj === null){
		return "null";
	};
	if (["string", "number", "boolean"].indexOf(typeof obj) >= 0){
		return JSON.stringify(obj);
	};
	if (typeof obj === "function"){
		var code = obj.toString();
		var lines = code
			.split(opts.n);
		code = lines.slice(0, 1).concat(
			lines.slice(1)
				.map(strPrefix.bind(null, tabPrefix))
			)
			.join(opts.n);
		return code;
	};
	if (typeof obj === "object"){
		var codeParts;
		if (Array.isArray(obj)){
			codeParts = obj.map(function(val){
				return tabPrefix + opts.tab + toJs(val, opts, tabOffest + 1);
			});
			return '[' + opts.n + codeParts.join(',' + opts.n) + opts.n + tabPrefix + ']';
		};
		codeParts = [];
		for (var key in obj){
			if (obj[key] === undefined){
				continue;
			};
			codeParts.push(tabPrefix + opts.tab + '"' + key + '": ' + toJs(obj[key], opts, tabOffest + 1));
		};		
		return '{' + opts.n + codeParts.join(',' + opts.n) + opts.n + tabPrefix + '}';
	};
};

export function strPrefix(prefix, str){
	return prefix + str;
};

export function prefixLines(str, prefix, triggerFn){
	var lines = str.split('\n').map(function(line, id){
		if (!triggerFn || triggerFn(line, id, lines)){
			return prefix + line;
		};
		return line;
	});
	return lines.join('\n');
};

export function fileExist(path){
	try{
		fs.accessSync(path);
	}catch(e){
		return false;
	};
	return true;
};

export function forTree(treeObj, childProp, fn){
	fn(treeObj);
	if (treeObj[childProp]){
		treeObj[childProp].forEach(function(node){
			forTree(node, childProp, fn);
		});
	};
};

export function getSubFolders(path){
	return fs.readdirSync(path).filter(function(subPath){
		var stat = fs.statSync(path + '/' + subPath);
		return stat.isDirectory();
	});
};

export function treeMap(treeObj, childProp, fn){
    var res = {};
	res = fn(treeObj);
	if (treeObj[childProp]){
		treeObj[childProp].forEach(function(node, id){
			res[childProp][id] = treeMap(node, childProp, fn);
		});
	};
	return res;
};