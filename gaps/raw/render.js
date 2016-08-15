var utils = require('fg-js/utils');
var valueMgr = require('fg-js/valueMgr');
var StrTpl = require('fg-js/strTpl.js');

function render(context, data){
	var meta = this;
	if (meta.isScopeHolder){
		meta.root.currentScopeHolder = meta;		
	};
	var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
	var attrObj = {};
	attrsArr.forEach(function(attr){
		var name = new StrTpl(attr.name).render(valueMgr.resolveAndRender.bind(null, meta, data));
		var value = new StrTpl(attr.value).render(valueMgr.resolveAndRender.bind(null, meta, data));
		attrObj[name] = value;
	});
	var triggers = [];
	context.gapStorage.setTriggers(meta, triggers);		
	var inner = meta.path 
		? valueMgr.getValue(meta, data, this.resolvedPath)
		: context.renderTpl(meta.content, meta, data);
	return utils.renderTag({
		"name": meta.tagName,
		"attrs": attrObj,
		"innerHTML": inner
	});
};

module.exports = render;