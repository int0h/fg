"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {StrTpl, read as readStrTpl} from '../StrTpl';  
import {GapClass, IGapOpts} from '../gapServer';  
import {Gap} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode, readTpl} from '../tplMgr';

function isScope(item){
	if (typeof item === "string"){
		return false;
	};
	return item.type === "scope";
};

export default class GRaw extends Gap{
	isRootNode: boolean;
	isScopeItem: boolean;
	isScopeHolder: boolean;
	tagName: string;

	static parse(node: IAstNode, html: string, parentMeta: Gap){
		if (node.type !== "tag"){
			return null;
		};
		var hasDynamicAttrs = false;
		var meta: GRaw;
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
			var value = readStrTpl(attrVal, valueMgr.parse);
			var name = readStrTpl(attr.name, valueMgr.parse);
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
		meta.content = readTpl(node, null, meta);		
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

	render(context: FgInstance, data: any){
		var meta = this;
		if (meta.isScopeHolder){
			meta.root.currentScopeHolder = meta;		
		};
		var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
		var attrObj = {};
		attrsArr.forEach(function(attr){
			var name = new StrTpl(attr.name).render(valueMgr.resolveAndRender.bind(null, meta, data));
			var value = new StrTpl(attr.value).render(valueMgr.resolveAndRender.bind(null, meta, data));
			attrObj[name] = value;
		});
		var triggers = [];
		context.gapStorage.setTriggers(meta, triggers);
		var inner = meta.path 
			? valueMgr.getValue(meta, data, this.resolvedPath)
			: context.renderTpl(meta.content, meta, data);
		return utils.renderTag({
			"name": meta.tagName,
			"attrs": attrObj,
			"innerHTML": inner
		});
	};

	update(context: FgInstance, meta: Gap, scopePath: any, value: any){
		// to do value update
		/*var attrData = utils.objPath(meta.scopePath, context.data);
		var renderedAttrs = utils.renderAttrs(meta.attrs, attrData);*/
		var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
		var attrObj = {};
		attrsArr.forEach(function(attr){
			var name = new StrTpl(attr.name).render(valueMgr.render.bind(null, meta, context.data));
			var value = new StrTpl(attr.value).render(function(path){
				var resolvedPath = valueMgr.resolvePath(meta, path);		
				return valueMgr.render(meta, context.data, resolvedPath);
			});
			attrObj[name] = value;
		});
		var dom = meta.getDom()[0];
		if (meta.path && meta.path.path.join('-') === scopePath.join('-')){
			dom.innerHTML = meta.path.escaped 
				? utils.escapeHtml(value)
				: value;
		};
		utils.objFor(attrObj, function(value, name){
			var oldVal = dom.getAttribute(name);
			if (oldVal !== value){
				dom.setAttribute(name, value);
			};
		});		
	};

};