"use strict";

import EventEmitter from '../eventEmitter';
import * as globalEvents from './globalEvents';
import {Gap} from './gapClassMgr';
import {Template, TplData} from '../tplMgr';
import {default as GRoot, IRootParsedData} from '../gaps/root';

export const fgClassTable: typeof Component[] = [];
export const fgInstanceTable: Component[] = [];
export const fgClassDict: any = {};

export interface IFgClassOpts{
	tpl: TplData;
	classFn: Function;
	name: string;
};

export type ComponentClass = new (parent: Component, selfMeta: Gap) => Component;

export abstract class Component{
	static id: number;
    static instances: Component[];
	static tpl: Template;
    static rootGap: GRoot;
	static name: string;
	static eventEmitter: EventEmitter;
	static createFn: Function;   

    id: number;
	code: string;
	//dom: HTMLElement[];
    ctor: typeof Component;
	data: any;
	rootGap: GRoot;
	selfGap: Gap;
	parent: Component;
	eventEmitter: EventEmitter;
	childFgs: Component[];  

    constructor(parent: Component, selfMeta: Gap){  
        this.ctor = this.constructor as typeof Component;         
		this.id = fgInstanceTable.length;  
		this.ctor.instances.push(this);
		this.code = null;
		this.parent = parent || null;
		this.eventEmitter = new EventEmitter(Component.eventEmitter);
		this.childFgs = [];
		fgInstanceTable.push(this);	
        this.selfGap = selfMeta;
	};

	static on(name: string, selector: string, fn?: Function){		
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

	static emit(/*name..., rest*/){
		this.eventEmitter.emit.apply(this.eventEmitter, arguments);	
	};

	static emitApply(name: string, thisArg: any, args: any[]){
		this.eventEmitter.emitApply(name, thisArg, args);	
	};

	static cookData(data: any){
		return data;
	};  

	static init(data: IFgClassOpts){
        this.tpl = new Template(data.tpl, null);
        const rootData: IRootParsedData = {
            type: "root",
            content: data.tpl,
            eid: null
        };
        this.rootGap = new GRoot(rootData);
        this.id = fgClassTable.length; 
        fgClassTable.push(this);
    };

	static render(data: any, meta?: Gap, parent?: Component){
		if (data instanceof HTMLElement){
			//return this.renderIn.apply(this, arguments);
		};
		const ctor = this as any as ComponentClass;
		const inst = new ctor(parent, meta); 
		const code = this.rootGap.render(inst, data);
		return inst;
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

	getHtml(data: any): string{
		this.data = data;        
		const cookedData = this.ctor.cookData(data);
        return this.ctor.rootGap.render(this, data);
	};

	update(scopePath: string[], newValue: any){
		

	};


	remove(virtual: boolean){
		
	};

	rerender(data: any){
		
	};

	getDom(){
		return this.rootGap.getDom();
	};

};

function match(fg: Component, node: HTMLElement, selector: string){
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

export function getFgByIid(iid: number): Component{
	return fgInstanceTable[iid];
};