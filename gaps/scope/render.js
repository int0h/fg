"use strict";

var anchorMgr = require('../../anchorMgr.js');
var valueMgr = require('../../valueMgr.js');
var renderScopeContent = require('./renderScopeContent.js');

function render(context, data){
	var meta = this;
	meta.items = [];
	var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
	this.scopePath = this.resolvedPath.path;
	var anchorCode = anchorMgr.genCode(context, meta);		
	var parts = renderScopeContent(context, meta, scopeData, data, 0);	
	return parts.join('\n') + anchorCode;
};

module.exports = render;