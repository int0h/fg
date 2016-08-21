"use strict";

function parse(node, html){
	if (node.tagName !== "content"){
		return null;
	};
	var meta = {};
	meta.type = "content";		
	meta.isVirtual = true;
	/*meta.fgName = node.nodeName.slice(3);
	meta.path = node.attrs.class 
		? node.attrs.class.split(' ')
		: [];
	meta.eid = node.attrs.id || null;
	meta.content = tplMgr.readTpl(node, html, meta);*/
	return meta;
};

module.exports = parse;