"use strict";

var gapClasses = {};
import {FgInstance} from './fgInstance.ts';
import {IValuePath} from '../valueMgr.ts';
import * as utils from '../utils.ts';
import * as valueMgr from '../valueMgr.ts';

function regGap(gapHandler){	
	gapClasses[gapHandler.name] = gapHandler;
	return gapHandler;
};
exports.regGap = regGap;

export class Gap{
	type: string;
	children: Gap[];
	parent: Gap;
	root: Gap;
	context: FgInstance;
	path: IValuePath;  
	resolvedPath: IValuePath;
	eid: number;
	gid: number;
	scopePath: IValuePath;
	isVirtual: boolean;
	fg: FgInstance;
	storageId: number;
	attrs: any;

	constructor (context, parsedMeta?, parent?){	
		utils.extend(this, parsedMeta); // todo: why?
		this.children = [];	
		this.parent = parent || null;
		this.root = this;
		this.context = context;	
		//this.scopePath = utils.getScopePath(this);
		//this.triggers = [];
		context.gapStorage.reg(this);
		if (this.path){
			this.resolvedPath = valueMgr.resolvePath(this, this.path); 
			if (this.resolvedPath.source === "data"){
				context.gapStorage.setTriggers(this, [this.resolvedPath.path]);
			};	
		};
		if (!parent){
			return this;
		};
		this.root = parent.root;
		parent.children.push(this);
	};

	closest(selector){
		var eid = selector.slice(1);
		var gap = this.parent;
		while (gap){
			if (gap.eid === eid){
				return gap;
			};
			gap = gap.parent;
		};
		return null;
	};

	data(val){
		if (arguments.length === 0){
			return utils.objPath(this.scopePath.path, this.context.data);
		};
		this.context.update(this.scopePath, val);	
	};

	findRealDown(){
		if (!this.isVirtual){
			return [this];
		};
		var res = [];
		this.children.forEach(function(child){
			res = res.concat(child.findRealDown());
		});
		return res;
	};

	getDom(){
		if (!this.isVirtual){
			var id = ["fg", this.context.id, "gid", this.gid].join('-');
			return [document.getElementById(id)];
		};
		var res = [];
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

export function render(context, parent, data, meta){
	var gap = new Gap(context, meta, parent);
	var gapClass = gapClasses[meta.type];
	return gapClass.render.call(gap, context, data);
};

export function update(context, gapMeta, scopePath, value, oldValue){
	var gapClass = gapClasses[gapMeta.type];
	if (!gapClass){
		return;
	};
	return gapClass.update(context, gapMeta, scopePath, value, oldValue);
};