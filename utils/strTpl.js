var utils = require('fg-js/utils');

function StrTpl(tpl){
	this.tpl = tpl;
};

StrTpl.parse = function(str){
	var re = /\%\@?[\w\d_\.\-]+%/g;
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
			path = [];
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
	if (!Array.isArray(this.tpl)){
		return paths;
	};	
	this.tpl.forEach(function(part){
		if (typeof part == "string"){
			return;
		};
		return paths.push(part.path);
	});
	return paths;
};

StrTpl.prototype.render = function(data){
	if (!Array.isArray(this.tpl)){
		return this.tpl;
	};
	return this.tpl.map(function(part){
		if (typeof part == "string"){
			return part;
		};
		return utils.objPath(part.path, data);
	}).join('');	
};

module.exports = StrTpl;
