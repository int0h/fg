"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../outerTypes';
import {Template, TplData} from '../tplMgr';


export interface IContentParsedData extends IGapData {
	content: TplData;
};

export default class GContent extends Gap{	
	type: string = "content";	
	content: Template;

	public static isVirtual = true; 

	constructor (context: FgInstance, parsedMeta: IContentParsedData, parent: Gap){
		super(context, parsedMeta, parent);
		this.content = new Template(context, parsedMeta.content, parent); 
	};

	static parse(node: IAstNode, parents: IGapData[]): IGapData{
		if (node.tagName !== "content"){
			return null;
		};
		let meta: IContentParsedData = {
			type: "content",
			content: Template.parse(node, null, parents)
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
		return '';//context.parent.renderTpl(context.rootGap.content, context.selfGap.parent, context.parent.data);
	};

};