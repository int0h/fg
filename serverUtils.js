var fs = require('fs');

function toJs(obj, opts, tabOffest){
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
	if (~["string", "number", "boolean"].indexOf(typeof obj)){
		return JSON.stringify(obj);
	};
	if (typeof obj == "function"){
		var code = obj.toString();
		lines = code
			.split(opts.n);
		code = lines.slice(0, 1).concat(
			lines.slice(1)
				.map(strPrefix.bind(null, tabPrefix))
			)
			.join(opts.n);
		return code;
	};
	if (typeof obj == "object"){
		if (Array.isArray(obj)){
			var codeParts = obj.map(function(val){
				return tabPrefix + opts.tab + toJs(val, opts, tabOffest + 1);
			});
			return '[' + opts.n + codeParts.join(',' + opts.n) + opts.n + tabPrefix + ']';
		};
		var codeParts = [];
		for (var i in obj){
			if (obj[i] === undefined){
				continue;
			};
			codeParts.push(tabPrefix + opts.tab + '"' + i + '": ' + toJs(obj[i], opts, tabOffest + 1));
		};		
		return '{' + opts.n + codeParts.join(',' + opts.n) + opts.n + tabPrefix + '}';
	};
};
exports.toJs = toJs;

function strPrefix(prefix, str){
	return prefix + str;
};
exports.strPrefix = strPrefix;

function prefixLines(str, prefix, triggerFn){
	var lines = str.split('\n').map(function(line, id){
		if (!triggerFn || triggerFn(line, id, lines)){
			return prefix + line;
		};
		return line;
	});
	return lines.join('\n')
};
exports.prefixLines = prefixLines;

function fileExist(path){
	try{
		fs.accessSync(path);
	}catch(e){
		return false;
	};
	return true;
};
exports.fileExist = fileExist;

function forTree(treeObj, childProp, fn){
	fn(treeObj);
	if (treeObj[childProp]){
		treeObj[childProp].forEach(function(node){
			forTree(node, fn);
		});
	};
};
exports.forTree = forTree;

function getSubFolders(path){
	return fs.readdirSync(path).filter(function(subPath){
		var stat = fs.statSync(path + '/' + subPath);
		return stat.isDirectory();
	});
};
exports.getSubFolders = getSubFolders;

function treeMap(treeObj, childProp, fn){
    var res = {};
	res = fn(treeObj);
	if (treeObj[childProp]){
		treeObj[childProp].forEach(function(node, id){
			res[childProp][id] = treeMap(node, childProp, fn);
		});
	};
	return res;
};
exports.treeMap = treeMap;
