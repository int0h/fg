"use strict";

function EventEmitter(parent){
	this.events = {};
	this.parent = parent;
};

EventEmitter.prototype.on = function(name, fn){
	var eventList = this.events[name];
	if (!eventList){
		eventList = [];
		this.events[name] = eventList;
	};
	eventList.push(fn);
};

EventEmitter.prototype.emit = function(name/*, rest*/){
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

EventEmitter.prototype.emitApply = function(name, thisArg, args){
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

module.exports = EventEmitter;