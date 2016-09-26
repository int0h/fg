"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode, readTpl, Tpl} from '../tplMgr';
import {IDataPath, IDataQuery} from '../valueMgr';

interface IFgParsedData extends IGapData {
	dataSource: IDataQuery;
	fgName: string;
	content: Tpl
};

export default class GFg extends Gap{
	parentFg: FgInstance;
	fgName: string;
	type: string = "fg";
	dataSource: IDataQuery;
	fg: FgInstance;

	constructor (context: FgInstance, parsedMeta: IGapData, parent: Gap){
		super(context, parsedMeta, parent);
		this.paths = [this.dataSource.path];
	};

	static parse(node: IAstNode, parents: IGapData[]): IGapData{
		if (node.type != 'tag' || !~node.tagName.indexOf("fg-")){
			return null;
		};
		const parsedPath = utils.parsePath(node);
		const resolvedQuery = valueMgr.resolvePath(parsedPath, parents);
		var meta: IFgParsedData = {
			type: "fg",
			fgName: node.tagName.slice(3),
			dataSource: resolvedQuery,
			eid: node.attrs.id || null,
			content: readTpl(node, null, parents)
		};
		return meta;
	};

	render(context: FgInstance, data: any){
		var self = this;
		this.parentFg = context;
		//this.renderedContent = context.renderTpl(this.content, meta, data);
		const win: any = window;
		var fgClass = win['$fg'].classes[this.fgName];
		var fgData: any = utils.deepClone(valueMgr.getValue(this, data, this.dataSource));	
		var fg = fgClass.render(fgData, this, context);
		fg.on('update', function(path: any, val: any){
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