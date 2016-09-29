"use strict";

import renderTpl from '../tplRender';
import * as gapClassMgr from './gapClassMgr';
import EventEmitter from '../eventEmitter';
import {Tpl} from '../tplMgr';
import {Gap} from './gapClassMgr';
import {FgClass} from './fgClass';
import * as utils from '../utils';
import * as globalEvents from './globalEvents';
import {default as GRoot, IRootParsedData} from '../gaps/root';
import GFg from '../gaps/fg';
const helper = require('./helper');

export const fgInstanceTable: FgInstance[] = [];

export class FgInstanceBase{ 
	id: number;
	name: string;
	fgClass: FgClass;
	code: string;	
	dom: HTMLElement[];
	data: any;
	rootGap: GRoot;
	selfGap: Gap;
	parent: FgInstance;
	eventEmitter: EventEmitter;
	childFgs: FgInstance[];

	constructor(fgClass: FgClass, parent: FgInstance){
		this.id = fgInstanceTable.length;
		fgClass.instances.push(this);
		this.name = fgClass.name;
		this.fgClass = fgClass;
		this.code = null;
		this.parent = parent || null;
		this.eventEmitter = new EventEmitter(fgClass.eventEmitter);
		this.childFgs = [];
		fgInstanceTable.push(this);	
	};

	on(event: string, fn: Function){
		globalEvents.listen(event);
		this.eventEmitter.on(event, fn);	
	};

	emit(...rest: any[]){
		this.eventEmitter.emit.apply(this.eventEmitter, arguments);		
	};

	emitApply(...rest: any[]){
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

	getHtml(data: any, meta?: Gap): string{
		this.data = data;
		this.selfGap = meta;
		this.rootGap = new GRoot(this, null, null);
		this.rootGap.type = "root";
		this.rootGap.isVirtual = true;
		this.rootGap.fg = this;
		const cookedData = this.fgClass.cookData(data);
		return this.renderTpl(this.fgClass.tpl, this.rootGap as Gap, cookedData);
	};

	update(scopePath: string[], newValue: any): FgInstance{
		return this;
		// if (arguments.length === 0){
		// 	return this.update([], this.data); // todo
		// };
		// if (arguments.length === 1){
		// 	return this.update([], arguments[0]);
		// };
		// const value: any = utils.deepClone(newValue);
		// const self = this;
		// const oldValue: any = utils.objPath(scopePath, this.data);
		// if (oldValue === value){
		// 	return this;
		// };	
		// this.emit('update', scopePath, newValue);
		// if (scopePath.length > 0){
		// 	utils.objPath(scopePath, this.data, value);
		// }else{
		// 	this.data = value;
		// }
		// const scope = this.gapStorage.byScope(scopePath);
		// const gaps = scope.target;
		// gaps.forEach(function(gap: Gap){
		// 	gap.update(self, gap, scopePath, value, oldValue);
		// });
		// scope.parents.forEach(function(parentNode: any){
		// 	parentNode.data.gaps.forEach(function(parentGap: Gap){
		// 		if (parentGap.type === "fg"){
		// 			var fgGap = parentGap as GFg;
		// 			const subPath = scopePath.slice(fgGap.dataSource.path.length);
		// 			//var subVal = utils.objPath(subPath, self.data);
		// 			fgGap.fg.update(subPath, newValue);
		// 		};			
		// 	});
		// });
		// scope.subs.forEach(function(sub){
		// 	const subVal = utils.objPath(sub.path, self.data);	
		// 	const subPath = sub.path.slice(scopePath.length);
		// 	const oldSubVal = utils.objPath(subPath, oldValue);
		// 	if (subVal === oldSubVal){
		// 		return;
		// 	};
		// 	sub.gaps.forEach(function(gap: Gap){
		// 		if (self.gapStorage.gaps.indexOf(gap) < 0){
		// 			return;
		// 		};
		// 		gapClassMgr.update(self, gap, sub.path, subVal, oldSubVal);
		// 	});
		// });
		// return this;
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

	rerender(data: any){
		this.clear();
		var dom = this.getDom()[0];
		this.code = this.getHtml(data, null);
		dom.outerHTML = this.code; // doesnt work with multi root
		this.assign();
		return this;
	};

	getDom(){
		return this.rootGap.getDom();
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
			.filter(function(id: number, elm: any){
				return dom.indexOf(elm) >= 0;
			});
		var childSelected = res.find(selector);
		return selfSelected.add(childSelected);
	};

	gap(id: string){
	};

	gaps(id: string){
			
	};

	sub(id: string){
		
	};
};

export class FgInstance extends FgInstanceBase{
	constructor(fgClass: any, parent: FgInstance){
		if (!!false){
			super(fgClass, parent);
		};
		return new fgClass.createFn(fgClass, parent);		
	};
};

function createScopeHelper(fg: FgInstance, obj: any, scopePath: string[]){
	var helper = Array.isArray(obj) 
		? [] 
		: {};
	utils.objFor(obj, function(value: any, key: string){
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


export function getFgByIid(iid: number): FgInstance{
	return fgInstanceTable[iid];
};