"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../tplMgr';

export default class GContent extends Gap{

	type: string = "content";

	static parse(node: IAstNode){
		if (node.tagName !== "content"){
			return null;
		};
		let meta: GContent = {} as GContent;
		meta.isVirtual = true;
		meta.type = "content";
		/*meta.fgName = node.nodeName.slice(3);
		meta.path = node.attrs.class 
			? node.attrs.class.split(' ')
			: [];
		meta.eid = node.attrs.id || null;
		meta.content = tplMgr.readTpl(node, html, meta);*/
		return meta;
	};

	render(context: FgInstance, data: any){
		this.scopePath = context.selfGap.scopePath;
		return context.parent.renderTpl(context.rootGap.content, context.selfGap.parent, context.parent.data);
	};

};