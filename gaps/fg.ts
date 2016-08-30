"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode, readTpl} from '../tplMgr';

export default class GFg extends Gap{
	parentFg: FgInstance;
	fgName: string;

	static parse(node: IAstNode){
		if (node.type != 'tag' || !~node.tagName.indexOf("fg-")){
			return null;
		};
		var meta:GFg;
		meta.type = "fg";		
		meta.isVirtual = true;
		meta.fgName = node.tagName.slice(3);
		meta.path = utils.parsePath(node);		
		meta.eid = node.attrs.id || null;
		meta.content = readTpl(node, null, meta);
		return meta;
	};

	render(context: FgInstance, data: any){
		var self = this;
		this.parentFg = context;
		//this.renderedContent = context.renderTpl(this.content, meta, data);
		var fgClass = window['$fg'].classes[this.fgName];
		var fgData = utils.deepClone(valueMgr.getValue(this, data, this.resolvedPath));	
		var fg = fgClass.render(fgData, this, context);
		fg.on('update', function(path, val){
			//context.update(scopePath.concat(path), val);
			//console.log(path, val);
		});
		this.fg = fg;
		fg.meta = this;
		context.childFgs.push(fg);
		return fg;
	};

	update(context: FgInstance, meta: Gap, scopePath: any, value: any){
		var node = meta.getDom()[0];
		if (!node){
			
		};
		node.innerHTML = value;
		//highlight(node, [0xffffff, 0xffee88], 500);
	};

};