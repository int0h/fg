"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {StrTpl, read as readStrTpl} from '../StrTpl';  
import {Gap} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode, readTpl} from '../tplMgr';

function isScope(item: Gap){
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
	type: string = "raw";
	static priority: number = -1;

	static parse(node: IAstNode, html?: string, parentMeta?: Gap){
		if (node.type !== "tag"){
			return null;
		};
		let hasDynamicAttrs = false;
		const meta: GRaw = {} as GRaw;
		meta.type = "raw";
		meta.isVirtual = false;
		meta.isRootNode = node.parent.type !== "tag";
		meta.tagName = node.tagName;
		if ("id" in node.attrs){
			meta.eid = node.attrs.id.value;
			delete node.attrs.id;
		};
		let attrsArr = utils.objToKeyValue(node.attrs, 'name', 'value');
		attrsArr = attrsArr.map(function(attr){	
			const attrVal = attr.value.type === "string"
				? attr.value.value
				: (attr.value.escaped ? '#' : '!') + '{' + attr.value.key + '}';		
			const value = readStrTpl(attrVal, valueMgr.parse);
			const name = readStrTpl(attr.name, valueMgr.parse);
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

	render(context: FgInstance, data: any): string{
		const meta = this;
		if (meta.isScopeHolder){
			meta.root.currentScopeHolder = meta;		
		};
		const attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
		let attrObj: any = {};
		attrsArr.forEach(function(attr){
			const name = new StrTpl(attr.name).render(valueMgr.resolveAndRender.bind(null, meta, data));
			const value = new StrTpl(attr.value).render(valueMgr.resolveAndRender.bind(null, meta, data));
			attrObj[name] = value;
		});
		let triggers: string[][] = [];
		context.gapStorage.setTriggers(meta, triggers);
		const inner = meta.path 
			? valueMgr.render(meta, data, this.resolvedPath)
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
		const attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
		let attrObj: any = {};
		attrsArr.forEach(function(attr){
			const name = new StrTpl(attr.name).render(valueMgr.render.bind(null, meta, context.data));
			const value = new StrTpl(attr.value).render(function(path){
				const resolvedPath = valueMgr.resolvePath(meta, path);		
				return valueMgr.render(meta, context.data, resolvedPath);
			});
			attrObj[name] = value;
		});
		const dom = meta.getDom()[0];
		if (meta.path && meta.path.path.join('-') === scopePath.join('-')){
			dom.innerHTML = meta.path.escaped 
				? utils.escapeHtml(value)
				: value;
		};
		utils.objFor(attrObj, function(value: string, name: string){
			const oldVal = dom.getAttribute(name);
			if (oldVal !== value){
				dom.setAttribute(name, value);
			};
		});		
	};

};