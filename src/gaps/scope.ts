"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {GapClass, IGapOpts} from '../gapServer';  
import {Gap} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode, readTpl} from '../tplMgr';
import * as anchorMgr from '../anchorMgr';

function renderScopeContent(context: FgInstance, scopeMeta: Gap, scopeData: any, data: any, idOffset: number){
	var isArray = Array.isArray(scopeData);
	if (!isArray){
		scopeData = [scopeData];
	};
	var parts = scopeData.map(function(dataItem, id){
		var itemMeta = scopeMeta;
		var path = isArray
			? valueMgr.read([(id + idOffset).toString()])
			: valueMgr.read([]);
		var itemCfg: any = {
			"type": "scope-item",
			"isVirtual": true,
			"path": path,
			"content": scopeMeta.content
		};
		if (scopeMeta.eid){
			itemCfg.eid = scopeMeta.eid + '-item';
		};
		itemMeta = new gapClassMgr.Gap(context, itemCfg, itemMeta);		
		return gapClassMgr.render(context, scopeMeta, data, itemMeta);
	});
	return parts;
};

export default class GScope extends Gap{
	items: Gap[];
	scopePath: any;

	static parse(node: IAstNode, html){
		if (node.tagName !== "scope"){
			return null;
		};
		var meta: GScope;
		meta.type = "scope";
		meta.isVirtual = true;
		meta.path = utils.parsePath(node);		
		meta.content = readTpl(node, html, meta);
		meta.eid = node.attrs.id || null;
		return meta;
	};

	render(context: FgInstance, data: any){
		var meta = this;
		meta.items = [];
		var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
		this.scopePath = this.resolvedPath.path;
		var anchorCode = anchorMgr.genCode(context, meta);		
		var parts = renderScopeContent(context, meta, scopeData, data, 0);	
		return parts.join('\n') + anchorCode;
	};

	update(context: FgInstance, meta: Gap, scopePath: any, value: any, oldValue: any){
		value = value || [];
		oldValue = oldValue || [];
		for (var i = value.length; i < oldValue.length; i++){
			context.gapStorage.removeScope(scopePath.concat([i]));
		};
		if (value.length > oldValue.length){
			var dataSlice = value.slice(oldValue.length);
			var newContent = renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
			var anchor = anchorMgr.find(context, meta);		
			anchorMgr.insertHTML(anchor, 'before', newContent);
		};
	};

};