function StrTpl(tpl, valueParseFn){
	if (typeof tpl == "object"){
		this.src = tpl.src;
		this.gaps = tpl.gaps;
		this.parts = tpl.parts;
		return;
	};
    this.src = tpl;
    this.parts = [];
    this.gaps = [];
    return this.parse(tpl, valueParseFn);
};

StrTpl.read = function(tpl, valueParseFn){
	var res = new StrTpl(tpl, valueParseFn);
	if (res.isString){
		res = tpl;
	};
	return res;
};

var gapRe = /\$\{[^\}]*\}/gm;

StrTpl.prototype.parse = function(tpl, valueParseFn){
	var gapStrArr = tpl.match(gapRe)
	if (!gapStrArr){
		this.isString = true;
		this.parts = [tpl];
		return;
	};
	gapStrArr = gapStrArr.map(function(part){
		return part.slice(2, -1);
	});	
	this.gaps = gapStrArr.map(valueParseFn);
	this.parts = tpl.split(gapRe);
	return this;
};

function mixArrays(arrays){
	var id = 0;
	var maxLength = 0;
	var totalLength = 0;
	for (var i = 0; i < arguments.length; i++){
		maxLength = Math.max(arguments[i].length, maxLength);
		totalLength += arguments[i].length;
	};
	var resArr = [];
	var arrayCount = arguments.length;
	for (var id = 0; id < maxLength; id++){				
		for (var i = 0; i < arrayCount; i++){
			if (arguments[i].length > id){
				resArr.push(arguments[i][id]);
			};
		};
	};
	return resArr;
};

StrTpl.prototype.render = function(valueRenderFn){
	var gaps = this.gaps.map(valueRenderFn);
	var parts = mixArrays(this.parts, gaps);
	return parts.join('');	
};

module.exports = StrTpl;