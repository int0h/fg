var utils = require('fg-js/utils');
var valueMgr = require('fg-js/valueMgr.js');
var gapClassMgr = require('fg-js/client/gapClassMgr.js');
var renderScopeContent = require('./renderScopeContent.js');

function render(context, data){
	var meta = this;
	meta.items = [];
	//meta.scopePath = utils.getScopePath(meta);		
	//var scopeData = utils.objPath(meta.scopePath, data);
	var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
	this.scopePath = this.resolvedPath.path;
	var placeHolderInner = ['fg', context.id, 'scope-gid', meta.gid].join('-');
	if (!scopeData){
		return '<!--' + placeHolderInner + '-->';
	};		
	var parts = renderScopeContent(context, meta, scopeData, data, 0);
	parts.push('<!--' + placeHolderInner + '-->');
	return parts.join('\n');
};

module.exports = render;