"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, render} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode, readTpl} from '../tplMgr';
import * as anchorMgr from '../anchorMgr';
import GScopeItem from './scope-item';

function renderScopeContent(context: FgInstance, scopeMeta: Gap, scopeData: any, data: any, idOffset: number){
	const isArray = Array.isArray(scopeData);
	if (!isArray){
		scopeData = [scopeData];
	};
	const parts = scopeData.map(function(dataItem: any, id: number){
		let itemMeta = scopeMeta;
		const path = isArray
			? valueMgr.read([(id + idOffset).toString()])
			: valueMgr.read([]);
		let itemCfg: any = {
			"type": "scopeItem",
			"isVirtual": true,
			"path": path,
			"content": scopeMeta.content
		};
		if (scopeMeta.eid){
			itemCfg.eid = scopeMeta.eid + '-item';
		};
		itemMeta = new GScopeItem(context, itemCfg, itemMeta);		
		return itemMeta.render(context, data);
	});
	return parts;
};

export default class GScope extends Gap{
	items: Gap[];
	scopePath: any;
	type: string = "scope";

	static parse(node: IAstNode, html: string): Gap{
		if (node.tagName !== "scope"){
			return null;
		};
		const meta: GScope = {} as GScope;
		meta.type = "scope";
		meta.isVirtual = true;
		meta.path = utils.parsePath(node);		
		meta.content = readTpl(node, html, meta);
		meta.eid = node.attrs.id || null;
		return meta;
	};

	render(context: FgInstance, data: any): string{
		const meta = this;
		meta.items = [];
		const scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
		this.scopePath = this.resolvedPath.path;
		const anchorCode = anchorMgr.genCode(context, meta);		
		const parts = renderScopeContent(context, meta, scopeData, data, 0);	
		return parts.join('\n') + anchorCode;
	};

	update(context: FgInstance, meta: Gap, scopePath: any, value: any, oldValue: any){
		value = value || [];
		oldValue = oldValue || [];
		for (let i = value.length; i < oldValue.length; i++){
			context.gapStorage.removeScope(scopePath.concat([i]));
		};
		if (value.length > oldValue.length){
			const dataSlice = value.slice(oldValue.length);
			const newContent = renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
			const anchor = anchorMgr.find(context, meta);		
			anchorMgr.insertHTML(anchor, 'before', newContent);
		};
	};

};