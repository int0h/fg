var utils = require('fg-js/utils');

function StrTpl(tpl){
	this.tpl = tpl;
};

StrTpl.parse = function(str){
	var re = /\%\@?[\w\d_\.]+%/g;
	var gaps = str.match(re);
	if (!gaps){
		return str;
	};
	gaps = gaps.map(function(gap){
		var pathStr = gap.slice(1, -1);
		var path = [];
		if (pathStr[0] == "@"){
			pathStr = pathStr.slice(1);
		}else{
			path = ["data"];
		};
		var path = path.concat(pathStr.split('.'));
		return {
			"path": path
		};
	});
	var tplParts = str.split(re);
	var tpl = utils.mixArrays(tplParts, gaps);
	return tpl;
};

StrTpl.prototype.getPaths = function(){
	var paths = [];
	if (typeof tpl == "string"){
		return paths;
	};	
	tpl.forEach(function(part){
		if (typeof part == "string"){
			return;
		};
		return path.push(part.path);
	});
	return paths;
};

StrTpl.prototype.render = function(data){
	if (typeof tpl == "string"){
		return tpl;
	};
	return tpl.map(function(part){
		if (typeof part == "string"){
			return part;
		};
		return objPath(part.path, data);
	}).join('');	
};

module.exports = StrTpl;
