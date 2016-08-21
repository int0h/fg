"use strict";

var utils = require('fg-js/utils');
var tplMgr = require('fg-js/tplMgr.js');

function parse(node, html){
	if (node.tagName !== "scope"){
		return null;
	};
	var meta = {};
	meta.type = "scope";
	meta.isVirtual = true;
	meta.path = utils.parsePath(node);		
	meta.content = tplMgr.readTpl(node, html, meta);
	meta.eid = node.attrs.id || null;
	return meta;
};

module.exports = parse;