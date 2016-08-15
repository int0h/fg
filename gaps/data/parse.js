var utils = require('fg-js/utils');

function parse(node, html){
	if (node.tagName != "data"){
		return null;
	};
	var meta = {};
	meta.type = "data";		
	meta.isVirtual = false;
	meta.path = utils.parsePath(node);		
	meta.eid = node.attrs.id || null;
	return meta;
};

module.exports = parse;