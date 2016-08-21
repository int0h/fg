"use strict";

var StrTpl = require('fg-js/strTpl.js');
var gapClassMgr = require('fg-js/client/gapClassMgr.js');

function render(context, data){
	var meta = this;
	var tpl = new StrTpl(meta.tpl);
	return tpl.render(function(path){
		var dataMeta = {
			"type": "data",
			"path": path			
		};
		var itemMeta = new gapClassMgr.Gap(context, dataMeta, meta.parent);
		return gapClassMgr.render(context, meta.parent, data, itemMeta);
	});
};

module.exports = render;