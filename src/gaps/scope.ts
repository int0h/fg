"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, render, IGapData} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance'; 
import {IAstNode} from '../outerTypes'; 
import {Template, TplData} from '../tplMgr';
import * as anchorMgr from '../anchorMgr';
import {default as GScopeItem, IScopeItemParsedData} from './scope-item';
import {IDataPath, IDataQuery, IScope} from '../valueMgr';

function renderScopeContent(context: FgInstance, scopeMeta: GScope, scopeData: any, data: any, idOffset: number){
	const isArray = Array.isArray(scopeData);
	if (!isArray){
		scopeData = [scopeData];
	};
	const parts = scopeData.map(function(dataItem: any, id: number){
		let dataSource: IDataQuery = {
			escaped: false,
			source: "data",
			path: scopeMeta.scope.path
		};
		if (isArray){
			dataSource.path.push('*');
		};
		let itemCfg: IScopeItemParsedData = {
			"type": "scopeItem",
			"isVirtual": true,
			"dataSource": dataSource,
			"content": null,
			"scopeId": id
		};
		if (scopeMeta.eid){
			itemCfg.eid = scopeMeta.eid + '-item';
		};
		const itemMeta = new GScopeItem(context, itemCfg, scopeMeta);		
		return itemMeta.render(context, data);
	});
	return parts;
};

interface IScopeParsedData extends IGapData {
	scope: IScope;
	content: TplData;
};

export default class GScope extends Gap{
	content: Template;
	scope: IScope;
	items: Gap[];
	type: string = "scope";
	
	public static isVirtual = true;

	constructor (context: FgInstance, parsedMeta: IGapData, parent: Gap){
		super(context, parsedMeta, parent);
		this.paths = [this.scope.path];
	};

	static parse(node: IAstNode, parents: IGapData[], html?: string): IGapData{
		if (node.tagName !== "scope"){
			return null;
		};
		const scopeName: string = "scope";
		const parsedPath = utils.parsePath(node);		
		const scopeDataScource = valueMgr.resolvePath(parsedPath, parents);
		const scopePath = scopeDataScource.path;
		const meta: IScopeParsedData = {
			type: "scope",
			eid: node.attrs.id || null,
			scope: {
				name: scopeName,
				path: scopePath,
			},
			content: null
		};
		meta.content = Template.parse(node, null, parents.concat([meta]));
		return meta;
	};

	render(context: FgInstance, data: any): string{
		const meta = this;
		meta.items = [];
		const scopeData = utils.objPath(this.scope.path, data);		
		const anchorCode = anchorMgr.genCode(context, meta);		
		const parts = renderScopeContent(context, meta, scopeData, data, 0);	
		return parts.join('\n') + anchorCode;
	};

	update(context: FgInstance, meta: GScope, scopePath: any, value: any, oldValue: any){
		value = value || [];
		oldValue = oldValue || [];
		for (let i = value.length; i < oldValue.length; i++){
		};
		if (value.length > oldValue.length){
			const dataSlice = value.slice(oldValue.length);
			const newContent = renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
			const anchor = anchorMgr.find(context, meta);		
			anchorMgr.insertHTML(anchor, 'before', newContent);
		};
	};

};