"use strict";

function update(context, meta, scopePath, value){
	// to do value update
	var valueMgr = require('fg-js/valueMgr');
	var utils = require('fg-js/utils');
	var StrTpl = require('fg-js/strTpl.js');

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
	if (meta.path && meta.path.path.join('-') === scopePath.join('-')){
		dom.innerHTML = meta.path.escaped 
			? utils.escapeHtml(value)
			: value;
	};
	utils.objFor(attrObj, function(value, name){
		var oldVal = dom.getAttribute(name);
		if (oldVal !== value){
			dom.setAttribute(name, value);
		};
	});		
};

module.exports = update;