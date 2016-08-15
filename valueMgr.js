var utils = require('fg-js/utils');

function read(parts){
	var source = "data";
	var path = parts.map(function(part){		
		if (part[0] == '$'){
			return {
				op: part.slice(1)
			};
		};
		return part; 
	});
	return {
		"source": source,
		"path": path
	};
};
exports.read = read;

function parse(str){
	var parts = str.split('.');
	return read(parts);
};
exports.parse = parse;

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

function resolvePath(meta, path){
	var scopePath = findScopePath(meta);
	var res = {
		source: "data"
	};
	res.path = scopePath.slice();
	path.path.forEach(function(key){
		if (typeof key == "string"){
			res.path.push(key);			
			return;
		};
		if (key.op == "root"){
			res.path = [];
		} else if (key.op == "up"){
			res.path.pop();
		};
	});
	return res;
};
exports.resolvePath = resolvePath;

function getValue(meta, data, resolvedPath){
	var sourceTable = {
		"data": data,
		"meta": meta
	};
	var sourceData = sourceTable[resolvedPath.source];
	var res = utils.objPath(resolvedPath.path, sourceData);
	return res;
};
exports.getValue = getValue;

function render(meta, data, resolvedPath){
	return getValue(meta, data, resolvedPath).toString();
};
exports.render = render;

function resolveAndRender(meta, data, path){
	var resolvedPath = resolvePath(meta, path);
	return render(meta, data, path);
};
exports.resolveAndRender = resolveAndRender;
