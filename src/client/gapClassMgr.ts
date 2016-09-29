"use strict";

import {FgInstance} from './fgInstance';
import {IDataPath} from '../valueMgr';
import {Tpl} from '../tplMgr';
import * as utils from '../utils';
import * as valueMgr from '../valueMgr';
import {IAstNode} from '../tplMgr';

export interface IGapData{
	type: string;
	isVirtual?: boolean;
	eid?: string;
	scope?: {
		name: string,
		path: IDataPath
	},
	scopeId?: number
};

export interface IScopeTable {
	[key: string]: IDataPath;
};

export type GapClass = new (context: FgInstance, parsedMeta: IGapData, parent: Gap) => Gap;

export abstract class Gap{
	type: string;
	children: Gap[] = [];
	parent: Gap;
	root: Gap;
	context: FgInstance;
	paths: IDataPath[] = [];	
	deps: IDataPath[] = [];
	eid: string;
	gid: number;
	isVirtual: boolean;
	scopeTable: IScopeTable;

	public static priority: number = 0;

	constructor (context: FgInstance, parsedMeta: IGapData, parent: Gap){	
		utils.extend(this, parsedMeta); // todo: why?
		this.children = [];	
		this.context = context;			
		if (parent){
			this.parent = parent;					
			this.root = parent.root;
			parent.children.push(this);
		}else{
			this.parent = null;					
			this.root = this;
		};
		
	};

	static afterParse(gapData: IGapData, parents: IGapData[]){

	};

	static parse(node: IAstNode, parents: IGapData[], html?: string): IGapData{
		return null;
	};

	abstract render(context: FgInstance, data: any): string;

	update(context: FgInstance, meta: Gap, scopePath: any, value: any, oldValue: any): void{
		return;
	};

	closest(selector: string): Gap{
		const eid = selector.slice(1);
		let gap = this.parent;
		while (gap){
			if (gap.eid === eid){
				return gap;
			};
			gap = gap.parent;
		};
		return null;
	};

	data(val?: any){
		// TODO: !
		// if (arguments.length === 0){
		// 	return utils.objPath(this.scopePath.path, this.context.data);
		// };
		// this.context.update(this.scopePath.path, val);	
	};

	findRealDown(): Gap[]{
		if (!this.isVirtual){
			return [this];
		};
		let res: Gap[] = [];
		this.children.forEach(function(child){
			res = res.concat(child.findRealDown());
		});
		return res;
	};

	getDom(): HTMLElement[]{
		if (!this.isVirtual){
			var id = ["fg", this.context.id, "gid", this.gid].join('-');
			return [document.getElementById(id)];
		};
		var res: HTMLElement[] = [];
		this.findRealDown().forEach(function(gap){
			res = res.concat(gap.getDom());
		});
		return res;
	};

	removeDom(){
		var dom = this.getDom();
		dom.forEach(function(elm){
			if (!elm){
				return;
			};
			elm.remove();
		});
	};
};

export function render(context: FgInstance, parent: any, data: any, meta: any){
	var gapClass: any = gaps[meta.type];
	var gap = new gapClass(context, meta, parent) as Gap;
	return gap.render(context, data);
};

export function update(context: FgInstance, gapMeta: any, scopePath: any, value: any, oldValue: any){
	var gapClass: any = gaps[gapMeta.type];
	if (!gapClass){
		return;
	};
	return gapClass.update(context, gapMeta, scopePath, value, oldValue);
};

import gaps from '../gaps';