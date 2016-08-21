"use strict";

var tplMgr = require('fg-js/tplMgr.js');
var utils = require('fg-js/utils');
var StrTpl = require('fg-js/strTpl.js');
var valueMgr = require('fg-js/valueMgr.js');

function isScope(item){
	if (typeof item === "string"){
		return false;
	};
	return item.type === "scope";
};

function parse(node, html, parentMeta){
	if (node.type !== "tag"){
		return null;
	};
	var hasDynamicAttrs = false;
	var meta = {};
	meta.type = "raw";
	meta.isVirtual = false;
	meta.isRootNode = node.parent.type !== "tag";
	meta.tagName = node.tagName;
	if ("id" in node.attrs){
		meta.eid = node.attrs.id.value;
		delete node.attrs.id;
	};
	var attrsArr = utils.objToKeyValue(node.attrs, 'name', 'value');
	attrsArr = attrsArr.map(function(attr){	
		var attrVal = attr.value.type === "string"
			? attr.value.value
			: (attr.value.escaped ? '#' : '!') + '{' + attr.value.key + '}';		
		var value = StrTpl.read(attrVal, valueMgr.parse);
		var name = StrTpl.read(attr.name, valueMgr.parse);
		if (typeof value !== "string" || typeof name !== "string"){
			hasDynamicAttrs = true;
		};
		return {
			"name": name,
			"value": value
		};
	});		
	meta.attrs = utils.keyValueToObj(attrsArr, 'name', 'value');
	if (node.value){
		meta.path = valueMgr.parse(node.value.path, {
			escaped: node.value.escaped
		});
	};
	meta.content = tplMgr.readTpl(node, html, meta);		
	if (meta.content.some(isScope)){
		meta.isScopeHolder = true;			
	};
	if (parentMeta && parentMeta.type === "scope"){
		meta.isScopeItem = true;
	};
	if (
			!hasDynamicAttrs 
			&& !meta.eid
			&& !meta.isRootNode 
			&& !meta.isScopeHolder 
			&& !meta.isScopeItem
			&& !meta.path
		){
		return null;
	};
	return meta;
};

parse.priority = -1;

module.exports = parse;