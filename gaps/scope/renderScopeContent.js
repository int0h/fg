"use strict";

var valueMgr = require('fg-js/valueMgr.js');
var gapClassMgr = require('fg-js/client/gapClassMgr.js');

function renderScopeContent(context, scopeMeta, scopeData, data, idOffset){
	var isArray = Array.isArray(scopeData);
	if (!isArray){
		scopeData = [scopeData];
	};
	var parts = scopeData.map(function(dataItem, id){
		var itemMeta = scopeMeta;
		var path = isArray
			? valueMgr.read([(id + idOffset).toString()])
			: valueMgr.read([]);
		var itemCfg = {
			"type": "scope-item",
			"isVirtual": true,
			"path": path,
			"content": scopeMeta.content
		};
		if (scopeMeta.eid){
			itemCfg.eid = scopeMeta.eid + '-item';
		};
		itemMeta = new gapClassMgr.Gap(context, itemCfg, itemMeta);		
		return gapClassMgr.render(context, scopeMeta, data, itemMeta);
	});
	return parts;
};

module.exports = renderScopeContent;