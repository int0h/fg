var utils = require('fg-js/utils');
var tplMgr = require('fg-js/tplMgr.js');

function parse(node, html){
	if (node.type != 'tag' || !~node.tagName.indexOf("fg-")){
		return null;
	};
	var meta = {};
	meta.type = "fg";		
	meta.isVirtual = true;
	meta.fgName = node.tagName.slice(3);
	meta.path = utils.parsePath(node);		
	meta.eid = node.attrs.id || null;
	meta.content = tplMgr.readTpl(node, html, meta);
	return meta;
};

module.exports = parse;