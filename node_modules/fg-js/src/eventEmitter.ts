"use strict";

export default class EventEmitter{
	events: {
		[key: string]: any;
	};
	parent: EventEmitter;

	constructor(parent?: EventEmitter){
		this.events = {};
		this.parent = parent;
	};

	on(name: string, fn: Function){
		var eventList = this.events[name];
		if (!eventList){
			eventList = [];
			this.events[name] = eventList;
		};
		eventList.push(fn);
	};

	emit(name: string, ...emitArgs: any[]){
		if (this.parent){
			this.parent.emit.apply(this.parent, arguments);
		};
		var eventList = this.events[name];
		if (!eventList){
			return;
		};
		eventList.forEach(function(fn: Function){
			fn.apply(this, emitArgs);
		});
	};

	emitApply(name: string, thisArg: any, args: any[]){
		if (this.parent){
			this.parent.emitApply.apply(this.parent, arguments);
		};
		var eventList = this.events[name];
		if (!eventList){
			return;
		};
		eventList.forEach(function(fn: Function){
			fn.apply(thisArg, args);
		});
	};
};