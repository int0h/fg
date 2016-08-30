"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {GapClass, IGapOpts} from '../gapServer';  
import {Gap} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../tplMgr';

export default class GContent extends Gap{

	static parse(node: IAstNode){
		if (node.tagName !== "content"){
			return null;
		};
		var meta: GContent;
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

	render(context: FgInstance, data: any){
		this.scopePath = context.gapMeta.scopePath;
		return context.parent.renderTpl(context.meta.content, context.gapMeta.parent, context.parent.data);
	};

};