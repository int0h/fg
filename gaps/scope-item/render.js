var utils = require('fg-js/utils');		
var valueMgr = require('fg-js/valueMgr.js');

function render(context, data){
	var meta = this;
	var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
	this.scopePath = this.resolvedPath.path;
	if (!scopeData){
		return '';
	};
	return context.renderTpl(meta.content, meta, data);
};

module.exports = render;