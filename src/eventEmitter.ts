"use strict";

export interface IEventEmitter{
	events: Object;
	parent?: IEventEmitter;
	on: Function;
	emit: Function;
	emitApply: Function;
};

export default function EventEmitter(parent?: IEventEmitter){
	this.events = {};
	this.parent = parent;
};

EventEmitter.prototype.on = function(name: string, fn: Function){
	var eventList = this.events[name];
	if (!eventList){
		eventList = [];
		this.events[name] = eventList;
	};
	eventList.push(fn);
};

EventEmitter.prototype.emit = function(name: string, ...rest){
	if (this.parent){
		this.parent.emit.apply(this.parent, arguments);
	};
	var eventList = this.events[name];
	if (!eventList){
		return;
	};
	var emitArgs = [].slice.call(arguments, 1);	 
	eventList.forEach(function(fn){
		fn.apply(this, emitArgs);
	});
};

EventEmitter.prototype.emitApply = function(name: string, thisArg, args: any[]){
	if (this.parent){
		this.parent.emitApply.apply(this.parent, arguments);
	};
	var eventList = this.events[name];
	if (!eventList){
		return;
	};
	eventList.forEach(function(fn){
		fn.apply(thisArg, args);
	});
};