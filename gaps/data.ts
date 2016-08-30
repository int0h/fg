"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../tplMgr';

export default class GData extends Gap{

	static parse(node: IAstNode){
		if (node.tagName != "data"){
			return null;
		};
		var meta: GData;
		meta.type = "data";		
		meta.isVirtual = false;
		meta.path = utils.parsePath(node);		
		meta.eid = node.attrs.id || null;
		return meta;
	};

	render(context: FgInstance, data: any){
		var value = valueMgr.render(this, data, this.resolvedPath);
		return utils.renderTag({
			name: "span",
			attrs: this.attrs,
			innerHTML: value
		});
	};

	update(context: FgInstance, meta: Gap, scopePath: any, value: any){
		var node = meta.getDom()[0];
		if (!node){
			
		};
		node.innerHTML = value;
		//highlight(node, [0xffffff, 0xffee88], 500);
	};

};