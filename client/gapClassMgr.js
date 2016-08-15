"use strict";

var gapClasses = {};
var utils = require('fg-js/utils');
var valueMgr = require('fg-js/valueMgr');

function regGap(gapHandler){	
	gapClasses[gapHandler.name] = gapHandler;
	return gapHandler;
};
exports.regGap = regGap;

function Gap(context, parsedMeta, parent){	
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

Gap.prototype.closest = function(selector){
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

Gap.prototype.data = function(val){
	if (arguments.length === 0){
		return utils.objPath(this.scopePath, this.context.data);
	};
	this.context.update(this.scopePath, val);	
};

Gap.prototype.findRealDown = function(){
	if (!this.isVirtual){
		return [this];
	};
	var res = [];
	this.children.filter(function(child){
		res = res.concat(child.findRealDown());
	});
	return res;
};

Gap.prototype.getDom = function(){
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

Gap.prototype.removeDom = function(){
	var dom = this.getDom();
	dom.forEach(function(elm){
		if (!elm){
			return;
		};
		elm.remove();
	});
};

exports.Gap = Gap;

function render(context, parent, data, meta){
	var gap = new Gap(context, meta, parent);
	var gapClass = gapClasses[meta.type];
	return gapClass.render.call(gap, context, data);
};

exports.render = render;

function update(context, gapMeta, scopePath, value, oldValue){
	var gapClass = gapClasses[gapMeta.type];
	if (!gapClass){
		return;
	};
	return gapClass.update(context, gapMeta, scopePath, value, oldValue);
};

exports.update = update;