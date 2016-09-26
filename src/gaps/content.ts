"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../tplMgr';

interface IContentParsedData extends IGapData {
};

export default class GContent extends Gap{

	type: string = "content";	
	public static isVirtual = true; 

	static parse(node: IAstNode): IGapData{
		if (node.tagName !== "content"){
			return null;
		};
		let meta: IContentParsedData = {
			type: "content"
		};
		/*meta.fgName = node.nodeName.slice(3);
		meta.path = node.attrs.class 
			? node.attrs.class.split(' ')
			: [];
		meta.eid = node.attrs.id || null;
		meta.content = tplMgr.readTpl(node, html, meta);*/
		return meta;
	};

	render(context: FgInstance, data: any){
		return context.parent.renderTpl(context.rootGap.content, context.selfGap.parent, context.parent.data);
	};

};