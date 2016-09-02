"use strict";

import EventEmitter from '../eventEmitter';
import * as globalEvents from './globalEvents';
import * as fgInstanceModule from './fgInstance';
import {FgInstance} from './fgInstance';
import {Gap} from './gapClassMgr';
import {Tpl} from '../tplMgr';

export const fgClassTable: FgClass[] = [];
export const fgClassDict: any = {};

export interface IFgClassOpts{
	tpl: Tpl;
	classFn: Function;
	name: string;
};

export class FgClass{
	id: number;
	instances: fgInstanceModule.FgInstance[];
	tpl: Tpl;
	name: string;
	eventEmitter: EventEmitter;
	createFn: Function;
	
	constructor(opts: IFgClassOpts){
		this.id = fgClassTable.length;	
		this.instances = [];
		this.tpl = opts.tpl;
		this.name = opts.name;
		this.eventEmitter = new EventEmitter();
		fgClassDict[opts.name] = this;
		fgClassTable.push(this);	
		function FgInstance(){
			fgInstanceModule.FgInstanceBase.apply(this, arguments);
		};
		this.createFn = FgInstance;
		this.createFn.constructor = fgInstanceModule.FgInstanceBase;	
		this.createFn.prototype = Object.create(fgInstanceModule.FgInstanceBase.prototype);	
		const classFn = opts.classFn;
		if (classFn){
			classFn(this, this.createFn.prototype);
		};
	};

	on(name: string, selector: string, fn?: Function){	
		if (arguments.length === 2){
			name = name;
			fn = arguments[1];
			selector = null;
		}else{
			var originalFn = fn;
			fn = function(event: any){			
				if (match(this, event.target, selector)){
					originalFn.call(this, event);
				};
			};
		};
		globalEvents.listen(name);
		this.eventEmitter.on(name, fn);	
	};

	emit(/*name..., rest*/){
		this.eventEmitter.emit.apply(this.eventEmitter, arguments);	
	};

	emitApply(name: string, thisArg: any, args: any[]){
		this.eventEmitter.emitApply(name, thisArg, args);	
	};

	cookData(data: any){
		return data;
	};

	render(data: any, meta?: Gap, parent?: FgInstance){
		if (data instanceof HTMLElement){
			return this.renderIn.apply(this, arguments);
		};
		let fg = new fgInstanceModule.FgInstance(this, parent);
		fg.code = fg.getHtml(data, meta);
		return fg;
	};

	renderIn(parentNode: HTMLElement, data: any, meta?: Gap, parent?: FgInstance){
		const fg = this.render(data, meta, parent);
		parentNode.innerHTML = fg.code;
		fg.assign();
		return fg;
	};

	appendTo(parentNode: HTMLElement, data: any){
		let fg = this.render(data);	
		let div = document.createElement('div');
		div.innerHTML = fg.code;
		[].slice.call(div.children).forEach(function(child: HTMLElement){
			parentNode.appendChild(child);
		});
		fg.assign();
	};
	
};

function match(fg: FgInstance, node: HTMLElement, selector: string){
	let domElms = fg.getDom();
	while (node){
		if (node.matches(selector)){
			return true;
		};
		if (domElms.indexOf(node) >= 0){
			return false;
		};		
		node = node.parentElement;
	};
	return false;
};