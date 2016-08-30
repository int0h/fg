"use strict";

import renderTpl from '../tplRender';
import * as gapClassMgr from './gapClassMgr';
import {IEventEmitter} from '../eventEmitter';
import EventEmitter from '../eventEmitter';
import {Tpl} from '../tplMgr';
import {Gap} from './gapClassMgr';
import {FgClass} from './fgClass';
import * as utils from '../utils';
import GapStorage from './GapStorage';
var helper = require('./helper.js');
var globalEvents = require('fg-js/client/globalEvents.js');

export var fgInstanceTable = [];

export class FgInstanceBase{ 
	id: number;
	name: string;
	fgClass: FgClass;
	code: string;	
	dom: HTMLElement[];
	data: any;
	meta: Gap;
	gapMeta: Gap;
	parent: FgInstance;
	eventEmitter: IEventEmitter;
	gapStorage: any;
	childFgs: FgInstance[];

	constructor(fgClass: FgClass, parent: FgInstance){
		this.id = fgInstanceTable.length;
		fgClass.instances.push(this);
		this.name = fgClass.name;
		this.fgClass = fgClass;
		this.code = null;
		this.parent = parent || null;
		this.eventEmitter = new EventEmitter(fgClass.eventEmitter);
		this.gapStorage = new GapStorage(this);
		this.childFgs = [];
		fgInstanceTable.push(this);	
	};

	on(event: string, fn: Function){
		globalEvents.listen(event);
		this.eventEmitter.on(event, fn);	
	};

	emit(...rest){
		this.eventEmitter.emit.apply(this.eventEmitter, arguments);		
	};

	emitApply(...rest){
		this.eventEmitter.emit.apply(this.eventEmitter, arguments);		
	};

	toString(){
		return this.code;
	};

	assign(){
		// this.emitApply('ready', this, []);
		// this.dom = document.getElementById('fg-iid-' + this.id);
		// this.gapStorage.assign();
		// return this.dom;
	};

	renderTpl(tpl: Tpl, parent: Gap, data: any, meta?){
		return renderTpl.call({
			"renderGap": gapClassMgr.render,
			"context": this
		}, tpl, parent, data, meta);
	};

	getHtml(data: any, meta?){
		this.data = data;
		this.gapMeta = meta;
		var rootGap = new Gap(this, meta);
		rootGap.type = "root";
		rootGap.isVirtual = true;
		rootGap.fg = this;
		rootGap.scopePath.path = [];
		this.meta = rootGap;
		var cookedData = this.fgClass.cookData(data);
		return this.renderTpl(this.fgClass.tpl, rootGap, cookedData, metaMap.bind(null, this));
	};

	update(scopePath, newValue){
		if (arguments.length === 0){
			return this.update([], this.data); // todo
		};
		if (arguments.length === 1){
			return this.update([], arguments[0]);
		};
		var value = utils.deepClone(newValue);
		var self = this;
		var oldValue = utils.objPath(scopePath, this.data);
		if (oldValue === value){
			return this;
		};	
		this.emit('update', scopePath, newValue);
		if (scopePath.length > 0){
			utils.objPath(scopePath, this.data, value);
		}else{
			this.data = value;
		}
		var scope = this.gapStorage.byScope(scopePath);
		var gaps = scope.target;
		gaps.forEach(function(gap){
			gapClassMgr.update(self, gap, scopePath, value, oldValue);
		});
		scope.parents.forEach(function(parentNode){
			parentNode.data.gaps.forEach(function(parentGap){
				if (parentGap.type === "fg"){
					var subPath = scopePath.slice(parentGap.scopePath.length);
					//var subVal = utils.objPath(subPath, self.data);
					parentGap.fg.update(subPath, newValue);
				};			
			});
		});
		scope.subs.forEach(function(sub){
			var subVal = utils.objPath(sub.path, self.data);	
			var subPath = sub.path.slice(scopePath.length);
			var oldSubVal = utils.objPath(subPath, oldValue);
			if (subVal === oldSubVal){
				return;
			};
			sub.gaps.forEach(function(gap){
				if (self.gapStorage.gaps.indexOf(gap) < 0){
					return;
				};
				gapClassMgr.update(self, gap, sub.path, subVal, oldSubVal);
			});
		});
		return this;
	};

	cloneData(){
		return utils.deepClone(this.data);
	};

	clear(){
		this.childFgs.forEach(function(child){
			(child as FgInstanceBase).remove(true);
		});
		this.code = '';
		this.data = null;
		this.gapStorage = null;
		this.childFgs = [];
	};

	remove(virtual: boolean){
		if (!virtual){
			var dom = this.getDom();
			dom.forEach(function(elm){
				elm.remove();
			});
		};
		this.clear();
		var instanceId = this.fgClass.instances.indexOf(this);	
		this.fgClass.instances.splice(instanceId, 1);
		fgInstanceTable[this.id] = null;
	};

	rerender(data){
		this.clear();
		this.gapStorage = new GapStorage(this);
		var dom = this.getDom()[0];
		this.code = this.getHtml(data, null);
		dom.outerHTML = this.code; // doesnt work with multi root
		this.assign();
		return this;
	};

	getDom(){
		return this.meta.getDom();
	};

	jq(){
		var dom = this.getDom();
		var res = helper.jq(dom);
		if (arguments.length === 0){
			return res;
		};
		var selector = arguments[0];
		var selfSelected = res
			.parent()
			.find(selector)
			.filter(function(id, elm){
				return dom.indexOf(elm) >= 0;
			});
		var childSelected = res.find(selector);
		return selfSelected.add(childSelected);
	};

	gap(id){
		return this.gaps(id)[0];
	};

	gaps(id){
		var gaps = this.gapStorage.byEid(id);
		if (gaps){
			return gaps;
		};	
	};

	sub(id){
		var gap = this.gap(id);
		if (!gap){
			return null;
		};
		return gap.fg || null; 
	};
};

export class FgInstance extends FgInstanceBase{
	constructor(fgClass, parent){
		if (!!false){
			super(fgClass, parent);
		};
		return new fgClass.createFn(fgClass, parent);		
	};
};

function getClasses(meta){
	if (!meta || !meta.attrs || !meta.attrs.class){
		return [];
	};
	if (Array.isArray(meta.attrs.class)){
		return meta.attrs.class;
	};		
	return meta.attrs.class.split(' ');
};

function metaMap(fg, metaPart){
	var res: any = utils.simpleClone(metaPart);
	var classes = getClasses(res);
	var fg_cid = "fg-cid-" + fg.fgClass.id;
	res.attrs = utils.simpleClone(metaPart.attrs);
	if (Array.isArray(res.attrs.class)){
		res.attrs.class = ['fg', ' ', fg_cid, ' '].concat(classes);
		return res;	
	};	
	res.attrs.class = ['fg', fg_cid].concat(classes).join(' ');
	return res;
};

function createScopeHelper(fg, obj, scopePath){
	var helper = Array.isArray(obj) 
		? [] 
		: {};
	utils.objFor(obj, function(value, key){
		var propScopePath = scopePath.concat([key]);
		Object.defineProperty(helper, key, {
			get: function(){
				if (typeof value === "object"){
					return createScopeHelper(fg, obj[key], propScopePath);
				};
				return obj[key];
			},
			set: function(val){
				fg.update(propScopePath, val);				
			}	
		});
	});
	return helper;
};


export function getFgByIid(iid){
	return fgInstanceTable[iid];
};