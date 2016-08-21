"use strict";

var StrTpl = require('fg-js/strTpl.js');
var valueMgr = require('fg-js/valueMgr.js');

function parse(node/*, html, parentMeta*/){
	if (node.type !== "text"){
		return null;
	};
	var tpl = StrTpl.read(node.text, valueMgr.parse);
	if (typeof tpl === "string"){
		return null;
	};
	var meta = {};
	meta.type = "dynamic-text";
	meta.tpl = tpl; 
	return meta;
};

module.exports = parse;