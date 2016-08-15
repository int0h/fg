"use strict";

var gapClassMgr = require('fg-js/client/gapClassMgr.js');
var renderTpl = require('fg-js/tplRender.js').renderTpl;
var EventEmitter = require('fg-js/eventEmitter.js');
var utils = require('fg-js/utils.js');
var GapStorage = require('fg-js/client/gapStorage.js').GapStorage;
var helper = require('./helper.js');
var globalEvents = require('fg-js/client/globalEvents.js');

var fgInstanceTable = [];

function FgInstanceBase(fgClass, parent){
	this.id = fgInstanceTable.length;
	fgClass.instances.push(this);
	this.name = fgClass.name;
	this.fgClass = fgClass;
	this.code = null;
	this.parent = parent || null;
	this.eventEmitter = new EventEmitter(fgClass.eventEmitter);
	this.emitApply = this.eventEmitter.emitApply.bind(this.eventEmitter);
	this.gapStorage = new GapStorage(this);
	this.childFgs = [];
	fgInstanceTable.push(this);	
};

FgInstanceBase.prototype.on = function(event, fn){
	globalEvents.listen(event);
	this.eventEmitter.on(event, fn);	
};

FgInstanceBase.prototype.emit = function(/*name..., rest*/){
	this.eventEmitter.emit.apply(this.eventEmitter, arguments);	
};

function FgInstance(fgClass, parent){
	return new fgClass.createFn(fgClass, parent);
};

FgInstanceBase.prototype.toString = function(){
	return this.code;
};

FgInstanceBase.prototype.assign = function(){
	this.emitApply('ready', this, []);
	this.dom = document.getElementById('fg-iid-' + this.id);
	this.gapStorage.assign();
	return this.dom;
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
	var res = utils.simpleClone(metaPart);
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

FgInstanceBase.prototype.renderTpl = function(tpl, parent, data, meta){
	return renderTpl.call({
		"gapClassMgr": gapClassMgr,
		"context": this
	}, tpl, parent, data, meta);
};

FgInstanceBase.prototype.getHtml = function(data, meta){
	this.data = data;
	this.gapMeta = meta;
	var rootGap = new gapClassMgr.Gap(this, meta);
	rootGap.type = "root";
	rootGap.isVirtual = true;
	rootGap.fg = this;
	rootGap.scopePath = [];
	this.meta = rootGap;
	var cookedData = this.fgClass.cookData(data);
	return this.renderTpl(this.fgClass.tpl, rootGap, cookedData, metaMap.bind(null, this));
};

FgInstanceBase.prototype.update = function(scopePath, newValue){
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

FgInstanceBase.prototype.$d = function(){

};

FgInstanceBase.prototype.$data = function(newData){
	if (newData){
		//...
		return;
	};
	var helper = createScopeHelper(this, this.data, []);
	return helper;
};

FgInstanceBase.prototype.cloneData = function(){
	return utils.deepClone(this.data);
};

FgInstanceBase.prototype.clear = function(){
	this.childFgs.forEach(function(child){
		child.remove(true);
	});
	this.code = '';
	this.data = null;
	this.gapStorage = null;
	this.childFgs = [];
};

FgInstanceBase.prototype.remove = function(virtual){
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

FgInstanceBase.prototype.rerender = function(data){
	this.clear();
	this.gapStorage = new GapStorage(this);
	var dom = this.getDom()[0];
	this.code = this.getHtml(data);
	dom.outerHTML = this.code; // doesnt work with multi root
	this.assign();
	return this;
};

FgInstanceBase.prototype.getDom = function(){
	return this.meta.getDom();
};

FgInstanceBase.prototype.jq = function(){
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

FgInstanceBase.prototype.gap = function(id){
	return this.gaps(id)[0];
};

FgInstanceBase.prototype.gaps = function(id){
	var gaps = this.gapStorage.byEid(id);
	if (gaps){
		return gaps;
	};	
};

FgInstanceBase.prototype.elm = FgInstanceBase.prototype.gap; // legacy

FgInstanceBase.prototype.elms = FgInstanceBase.prototype.gaps; // legacy

FgInstanceBase.prototype.sub = function(id){
	var gap = this.gap(id);
	if (!gap){
		return null;
	};
	return gap.fg || null; 
};


function getFgByIid(iid){
	return fgInstanceTable[iid];
};

exports.getFgByIid = getFgByIid;
exports.FgInstance = FgInstance;
exports.FgInstanceBase = FgInstanceBase;
exports.fgInstanceTable = fgInstanceTable;