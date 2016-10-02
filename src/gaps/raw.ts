"use strict";

import * as utils from '../utils';  
import {IAttrs} from '../utils/tplUtils';  
import * as valueMgr from '../valueMgr';  
import * as strTpl from '../strTpl';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {Component} from '../client/componentBase'; 
import {IAstNode} from '../outerTypes';
import {Template, TplData} from '../tplMgr';
import {IDataPath, IDataQuery} from '../valueMgr';

function isScope(item: Gap){
	if (typeof item === "string"){
		return false;
	};
	return item.type === "scope";
};

export interface IRawParsedData extends IGapData {
	value: IDataQuery;
	tagName: string;
	attrs: RawAttrs;
	content: TplData;
};

export interface IRawAttr {
	name: strTpl.StrTplValue;
	value: strTpl.StrTplValue;
}

export type RawAttrs = IRawAttr[];

export default class GRaw extends Gap{
	type: string = "raw";
	value: IDataQuery = null;
	tagName: string;
	attrs: RawAttrs = [];
	content: Template;
	
	public static priority: number = -1;
	public static isVirtual = false; 

	constructor (parsedMeta: IRawParsedData, parent: Gap){
		super(parsedMeta, parent);
		this.content = new Template(parsedMeta.content, parent);		
		this.paths = [];
		if (this.value){
			this.paths.push(this.value.path);
		};
		this.attrs.forEach(attr => {
			if (typeof attr.name !== "string"){
				this.paths.push(attr.name.path);
			};
			if (typeof attr.value !== "string"){
				this.paths.push(attr.value.path);
			};
		});
	};

	static parse(node: IAstNode, parents: IGapData[], html?: string): IGapData{
		if (node.type !== "tag"){
			return null;
		};
		let isRootNode = false;
		let isScopeItem = false;
		let isScopeHolder = false;
		let hasDynamicAttrs = false;
		const meta: IRawParsedData = {
			type: "raw",
			tagName: node.tagName,
			attrs: [],
			value: null,
			eid: null,
			content: []
		};
		isRootNode = node.parent.type !== "tag";
		if ("id" in node.attrs){
			meta.eid = node.attrs.id.value;
			delete node.attrs.id;
		};
		let attrsArr = utils.objToKeyValue(node.attrs, 'name', 'value');
		attrsArr = attrsArr.map(function(attr){	
			const attrVal = attr.value.type === "string"
				? attr.value.value
				: (attr.value.escaped ? '#' : '!') + '{' + attr.value.key + '}';		
			const value = strTpl.parse(attrVal, valueMgr.parse);
			const name = strTpl.parse(attr.name, valueMgr.parse);
			if (typeof value !== "string" || typeof name !== "string"){
				hasDynamicAttrs = true;
			};
			return {name, value};
		});
		meta.attrs = attrsArr;
		if (node.value){
			meta.value = valueMgr.parse(node.value.path, {
				escaped: node.value.escaped
			});
		};				
		meta.content = Template.parse(node, null, parents.concat([meta]));		
		if (meta.content.some(isScope)){
			isScopeHolder = true;			
		};
		const parentMeta = parents[parents.length - 1];
		if (parentMeta && parentMeta.type === "scope"){
			isScopeItem = true;
		};
		if (
				!hasDynamicAttrs 
				&& !meta.eid
				&& !isRootNode 
				&& !isScopeHolder 
				&& !isScopeItem
				&& !meta.value
			){
			return null;
		};
		return meta;
	};	

	render(context: Component, data: any): string{
		const meta = this;
		// if (meta.isScopeHolder){
		// 	meta.root.currentScopeHolder = meta;		
		// };
		const attrsArr = meta.attrs;
		let attrObj: any = {};
		attrsArr.forEach(function(attr){
			const name = strTpl.render(attr.name, valueMgr.render.bind(null, meta, data));
			const value = strTpl.render(attr.value, valueMgr.render.bind(null, meta, data));
			attrObj[name] = value;
		});
		let triggers: string[][] = [];
		const inner = meta.value 
			? valueMgr.render(meta, data, this.value)
			: this.content.render(context, data);
		return utils.renderTag({
			"name": meta.tagName,
			"attrs": attrObj,
			"innerHTML": inner
		});
	};

	update(context: Component, meta: Gap, scopePath: any, value: any){
		// to do value update
		/*var attrData = utils.objPath(meta.scopePath, context.data);
		var renderedAttrs = utils.renderAttrs(meta.attrs, attrData);*/
		const asRaw = meta as GRaw;
		const attrsArr = utils.objToKeyValue(asRaw.attrs, 'name', 'value');
		let attrObj: any = {};
		attrsArr.forEach(function(attr){
			const name = strTpl.render(attr.name, valueMgr.render.bind(null, meta, context.data));
			const value = strTpl.render(attr.value, function(path){
				return valueMgr.render(meta, context.data, asRaw.value);
			});
			attrObj[name] = value;
		});
		const dom = meta.getDom()[0];
		if (asRaw.value && asRaw.value.path.join('-') === scopePath.join('-')){
			dom.innerHTML = asRaw.value.escaped 
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