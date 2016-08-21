"use strict";

var renderScopeContent = require('./renderScopeContent.js');
var anchorMgr = require('fg-js/anchorMgr.js');

function update(context, meta, scopePath, value, oldValue){
	var utils = require('fg-js/utils');
	value = value || [];
	oldValue = oldValue || [];
	for (var i = value.length; i < oldValue.length; i++){
		context.gapStorage.removeScope(scopePath.concat([i]));
	};
	if (value.length > oldValue.length){
		var dataSlice = value.slice(oldValue.length);
		var newContent = renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
		var anchor = anchorMgr.find(context, meta);		
		anchorMgr.insertHTML(anchor, 'before', newContent);
	};
	//context.rerender(context.data);
};

module.exports = update;