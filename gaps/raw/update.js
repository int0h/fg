function update(context, meta, scopePath, value){
	// to do value update
	var valueMgr = require('fg-js/valueMgr');
	var utils = require('fg-js/utils');
	var StrTpl = require('fg-js/strTpl.js');

	function renderAttrs(attrs, data){
		var resAttrs = {};
		utils.objFor(attrs, function(value, name){
			var nameTpl = new StrTpl(name);
			var valueTpl = new StrTpl(value);
			resAttrs[nameTpl.render(data)] = valueTpl.render(data);		
		});	
		return resAttrs;
	};

	/*var attrData = utils.objPath(meta.scopePath, context.data);
	var renderedAttrs = utils.renderAttrs(meta.attrs, attrData);*/
	var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
	var attrObj = {};
	attrsArr.forEach(function(attr){
		var name = new StrTpl(attr.name).render(valueMgr.render.bind(null, meta, context.data));
		var value = new StrTpl(attr.value).render(function(path){
			var resolvedPath = valueMgr.resolvePath(meta, path);		
			return valueMgr.render(meta, context.data, resolvedPath);
		});
		attrObj[name] = value;
	});
	var dom = meta.getDom()[0];
	if (meta.value && meta.valuePath.path.join('-') == scopePath.join('-')){
		dom.innerHTML = value;
	};
	utils.objFor(attrObj, function(value, name){
		var oldVal = dom.getAttribute(name);
		if (oldVal != value){
			dom.setAttribute(name, value);
		};
	});		
};

module.exports = update;