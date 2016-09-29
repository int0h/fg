"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../outerTypes';
import {IDataPath, IDataQuery} from '../valueMgr';

interface IDataParsedData extends IGapData {
	value: IDataQuery;
};

export default class GData extends Gap{

	type: string = "data";
	value: IDataQuery;
	public static isVirtual = false; 

	constructor (context: FgInstance, parsedMeta: IGapData, parent: Gap){
		super(context, parsedMeta, parent);
		this.paths = [this.value.path];
	};

	static parse(node: IAstNode, parents: IGapData[]): IGapData{
		if (node.tagName != "data"){
			return null;
		};
		const parsedPath = utils.parsePath(node);
		const resolvedQuery = valueMgr.resolvePath(parsedPath, parents);
		const meta: IDataParsedData = {
			type: "data",
			value: resolvedQuery,
			eid: node.attrs.id || null
		};
		return meta;
	};

	render(context: FgInstance, data: any): string{
		const value = valueMgr.render(this, data, this.value);
		return utils.renderTag({
			name: "span",
			attrs: {},
			innerHTML: value
		});
	};

	update(context: FgInstance, meta: Gap, scopePath: any, value: any){
		const node = meta.getDom()[0];
		if (!node){
			
		};
		node.innerHTML = value;
		//highlight(node, [0xffffff, 0xffee88], 500);
	};

};