(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

function genId(context, gap){
   	var id = ['fg', context.id, 'aid', gap.gid].join('-');
    return id;
};

function genCode(context, gap){
    var code = '<script type="fg-js/anchor" id="' 
        + genId(context, gap) 
        + '"></script>';
    return code;
};
exports.genCode = genCode;

function find(context, gap){
   	var id = genId(context, gap);    
    return document.getElementById(id);
};
exports.find = find;

function insertHTML(anchor, position, html){
   	var posTable = {
           "before": "beforebegin",
           "after": "afterend"
    };
    var pos = posTable[position];
    anchor.insertAdjacentHTML(pos, html);
};
exports.insertHTML = insertHTML;

},{}],2:[function(require,module,exports){
"use strict";

var EventEmitter = require('fg-js/eventEmitter.js');
var globalEvents = require('fg-js/client/globalEvents.js');
var fgInstanceModule = require('fg-js/client/fgInstance.js');

var fgClassTable = [];
var fgClassDict = {};

function FgClass(opts){
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
	var classFn = opts.classFn;
	if (classFn){
		classFn(this, this.createFn.prototype);
	};
};

function match(fg, node, selector){
	var domElms = fg.getDom();
	while (node){
		if (node.matches(selector)){
			return true;
		};
		if (domElms.indexOf(node) >= 0){
			return false;
		};		
		node = node.parentNode;
	};
	return false;
};

FgClass.prototype.on = function(name, selector, fn){	
	if (arguments.length === 2){
		name = name;
		fn = arguments[1];
		selector = null;
	}else{
		var originalFn = fn;
		fn = function(event){			
			if (match(this, event.target, selector)){
				originalFn.call(this, event);
			};
		};
	};
	globalEvents.listen(name);
	this.eventEmitter.on(name, fn);	
};

FgClass.prototype.emit = function(/*name..., rest*/){
	this.eventEmitter.emit.apply(this.eventEmitter, arguments);	
};

FgClass.prototype.emitApply = function(name, thisArg, args){
	this.eventEmitter.emitApply(name, thisArg, args);	
};

FgClass.prototype.cookData = function(data){
	return data;
};

FgClass.prototype.render = function(data, meta, parent){
	if (data instanceof HTMLElement){
		return this.renderIn.apply(this, arguments);
	};
	var fg = new fgInstanceModule.FgInstance(this, parent);
	fg.code = fg.getHtml(data, meta);
	return fg;
};

FgClass.prototype.renderIn = function(parentNode, data, meta, parent){
	var fg = this.render(data, meta, parent);
	parentNode.innerHTML = fg.code;
	fg.assign();
	return fg;
};

FgClass.prototype.appendTo = function(parentNode, data){
	var fg = this.render(data);	
	var div = document.createElement('div');
	div.innerHTML = fg.code;
	[].slice.call(div.children).forEach(function(child){
		parentNode.appendChild(child);
	});
	fg.assign();
};

exports.FgClass = FgClass;
exports.fgClassDict = fgClassDict;
exports.fgClassTable = fgClassTable;
},{"fg-js/client/fgInstance.js":3,"fg-js/client/globalEvents.js":7,"fg-js/eventEmitter.js":10}],3:[function(require,module,exports){
"use strict";

var gapClassMgr = require('fg-js/client/gapClassMgr.js');
var renderTpl = require('fg-js/tplRender.js').renderTpl;
var EventEmitter = require('../eventEmitter.js');
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
},{"../eventEmitter.js":10,"./helper.js":8,"fg-js/client/gapClassMgr.js":4,"fg-js/client/gapStorage.js":5,"fg-js/client/globalEvents.js":7,"fg-js/tplRender.js":27,"fg-js/utils.js":28}],4:[function(require,module,exports){
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
},{"fg-js/utils":28,"fg-js/valueMgr":31}],5:[function(require,module,exports){
"use strict";

var utils = require('fg-js/utils.js');
var TreeHelper = require('fg-js/utils/treeHelper.js');

function initNodeFn(){
	return {
		gaps: []
	};
};

function GapStorage(context){
	this.context = context;
	this.gaps = [];
	this.scopeTree = new TreeHelper({
		kind: 'dict',
		initNode: initNodeFn
	});
	this.eidDict = {};	
};

GapStorage.prototype.setScopeTrigger = function(gap, scopePath){
	var scope = this.scopeTree.access(scopePath);	
	scope.data.gaps.push(gap);
};

/*GapStorage.prototype.add = function(meta, scopeTriggers, gid){
	scopeTriggers = scopeTriggers || [meta.scopePath];
	var gap = {
		"id": gid || this.getGid(),
		"meta": meta
	};
	scopeTriggers.forEach(this.setScopeTrigger.bind(this, gap));
	this.gaps.push(gap);
};

GapStorage.prototype.setAttrs = function(meta, attrs, gid){
	var fgGapClass = 'fg-gap-' + this.context.id;
	attrs.class = attrs.class 
		? fgGapClass + ' ' + attrs.class
		: fgGapClass;
	attrs["data-fg-" + this.context.id + "-gap-id"] = gid;
	//attrs.id = ["fg", this.context.id, "gap-id", gid].join('-');
 	return attrs;
};*/

GapStorage.prototype.setTriggers = function(gapMeta, scopeTriggers){	
	scopeTriggers.forEach(this.setScopeTrigger.bind(this, gapMeta));
};

GapStorage.prototype.reg = function(gapMeta){
	var eid = gapMeta.eid;
	if (eid){		
		this.eidDict[eid] = this.eidDict[eid] || [];
		this.eidDict[eid].push(gapMeta);
	};
	var gid = this.getGid();
	gapMeta.gid = gid;
	if (!gapMeta.isVirtual){
		gapMeta.attrs = utils.simpleClone(gapMeta.attrs || {});		
		gapMeta.attrs.id = ["fg", this.context.id, "gid", gid].join('-');
	};
	gapMeta.storageId = this.gaps.length;
	this.gaps.push(gapMeta);		
	//return attrsObj;
};

GapStorage.prototype.assign = function(){
	//if ()
	this.gaps.forEach(function(gapMeta){
		if (gapMeta.type !== "root" && gapMeta.fg){
			gapMeta.fg.assign();
		};
	});
	return;
	// var self = this;
	// var gapNodes = this.context.dom.getElementsByClassName('fg-gap-' + this.context.id);
	// for (var i = 0; i < gapNodes.length; i++){
	// 	var gapNode = gapNodes[i];
	// 	var gid = gapNode.getAttribute('data-fg-' + this.context.id + '-gap-id');
	// 	var gap = self.gaps[gid];
	// 	if (!gap){continue};
	// 	if (gap.meta.fg){
	// 		gap.meta.fg.assign();
	// 	};
	// 	gap.meta.dom = gapNode;
	// };
};

/*GapStorage.prototype.subTree = function(scopePath){
	var branch = accessScopeLeaf(this.scopeTree, scopePath);
	var res = [];

	function iterate(node){
		for (var i in node.children){

		};
	};


};*/

GapStorage.prototype.byScope = function(scopePath, targetOnly){
	var scope = this.scopeTree.access(scopePath);		
	var subNodes = [];
	if (scope.childCount !== 0 && !targetOnly){
		subNodes = scope.getDeepChildArr().map(function(node){
			return {
				gaps: node.data.gaps,
				path: node.path	
			};			
		});
	};
	var parents = scope.getParents();
	return {
		target: scope.data.gaps,
		subs: subNodes,
		parents: parents
	};
};

GapStorage.prototype.removeScope = function(scopePath){
	var scope = this.byScope(scopePath);	
	var removedDomGaps = scope.target;
	var removedGaps = scope.target;
	scope.subs.forEach(function(node){
		removedGaps = removedGaps.concat(node.gaps);
	});
	this.scopeTree.remove(scopePath);
	this.gaps = this.gaps.filter(function(gap){
		return removedGaps.indexOf(gap) < 0;
	});
	removedDomGaps.forEach(function(gap){
		gap.removeDom();
	});
};

GapStorage.prototype.byEid = function(eid){
	return this.eidDict[eid];
};

GapStorage.prototype.getGid = function(){
	return this.gaps.length;
};

exports.GapStorage = GapStorage;

},{"fg-js/utils.js":28,"fg-js/utils/treeHelper.js":30}],6:[function(require,module,exports){
var gapClassMgr = require('fg-js/client/gapClassMgr.js');
gapClassMgr.regGap({
	"name": "content",
	"path": "../gaps/content",
	"render": require("../gaps/content/render.js"),
	"update": require("../gaps/content/update.js"),
});
gapClassMgr.regGap({
	"name": "data",
	"path": "../gaps/data",
	"render": require("../gaps/data/render.js"),
	"update": require("../gaps/data/update.js"),
});
gapClassMgr.regGap({
	"name": "dynamic-text",
	"path": "../gaps/dynamic-text",
	"render": require("../gaps/dynamic-text/render.js"),
	"update": require("../gaps/dynamic-text/update.js"),
});
gapClassMgr.regGap({
	"name": "fg",
	"path": "../gaps/fg",
	"render": require("../gaps/fg/render.js"),
	"update": require("../gaps/fg/update.js"),
});
gapClassMgr.regGap({
	"name": "raw",
	"path": "../gaps/raw",
	"render": require("../gaps/raw/render.js"),
	"update": require("../gaps/raw/update.js"),
});
gapClassMgr.regGap({
	"name": "scope",
	"path": "../gaps/scope",
	"render": require("../gaps/scope/render.js"),
	"update": require("../gaps/scope/update.js"),
});
gapClassMgr.regGap({
	"name": "scope-item",
	"path": "../gaps/scope-item",
	"render": require("../gaps/scope-item/render.js"),
	"update": require("../gaps/scope-item/update.js"),
});
},{"../gaps/content/render.js":11,"../gaps/content/update.js":12,"../gaps/data/render.js":13,"../gaps/data/update.js":14,"../gaps/dynamic-text/render.js":15,"../gaps/dynamic-text/update.js":16,"../gaps/fg/render.js":17,"../gaps/fg/update.js":18,"../gaps/raw/render.js":19,"../gaps/raw/update.js":20,"../gaps/scope-item/render.js":21,"../gaps/scope-item/update.js":22,"../gaps/scope/render.js":23,"../gaps/scope/update.js":25,"fg-js/client/gapClassMgr.js":4}],7:[function(require,module,exports){
var events = {};

function handler(name, event){
	var elm = event.target;
	while (elm){
		var fg = $fg.byDom(elm);
		if (fg){
			fg.emitApply(name, fg, [event]);
			//return;
		};
		elm = elm.parentNode;
	};
};

exports.listen = function(name){
	if (name in events){
		return;
	};	
	events[name] = true;
	document.addEventListener(name, handler.bind(null, name), {"capture": true});
};
},{}],8:[function(require,module,exports){
module.exports = $fg;

var fgClassModule = require('fg-js/client/fgClass.js');
var fgInstanceModule = require('fg-js/client/fgInstance.js');

function $fg(arg){
	if (arg instanceof HTMLElement){
		return $fg.byDom(arg);
	};
	if (typeof arg == "string"){
		return fgClassModule.fgClassDict[arg];
	};
};

$fg.load = function(fgData){
	if (Array.isArray(fgData)){		
		return fgData.map($fg.load);
	};
	return new fgClassModule.FgClass(fgData);
};

$fg.isFg = function(domNode){
	return domNode.classList && domNode.classList.contains('fg');
};

var iidRe = /fg\-iid\-(\d+)/g;
var idRe = /fg\-(\d+)\-gid\-(\d+)/g;

$fg.byDom = function(domNode){	
	if (!domNode || !domNode.className){
		return null;
	};
	if (!~domNode.className.split(' ').indexOf('fg')){
		return null;
	};
	if (!domNode.id){
		return null;
	};
	idRe.lastIndex = 0;
	var res = idRe.exec(domNode.id);
	if (!res){
		return null;
	};
	var iid = parseInt(res[1]);
	return fgInstanceModule.getFgByIid(iid);	
};

$fg.gapClosest = function(domNode){
	while (true){
		idRe.lastIndex = 0;
		var res = idRe.exec(domNode.id);
		if (!res){
			domNode = domNode.parentNode;
			if (!domNode){
				return null;
			};
			continue;
		};
		var iid = parseInt(res[1]);
		var fg = fgInstanceModule.getFgByIid(iid);
		var gid = parseInt(res[2]);
		return fg.gapStorage.gaps[gid];
	};
};

$fg.classes = fgClassModule.fgClassDict;

$fg.fgs = fgInstanceModule.fgInstanceTable;

$fg.jq = window.jQuery;

window.$fg = $fg;
},{"fg-js/client/fgClass.js":2,"fg-js/client/fgInstance.js":3}],9:[function(require,module,exports){
require('./gaps.js');
var fgHelper = require('./helper.js');
},{"./gaps.js":6,"./helper.js":8}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
function render(context, data){
	this.scopePath = context.gapMeta.scopePath;
	return context.parent.renderTpl(context.meta.content, context.gapMeta.parent, context.parent.data);
};

module.exports = render;
},{}],12:[function(require,module,exports){
function update(context, meta, scopePath, value){
	return;
};

module.exports = update;
},{}],13:[function(require,module,exports){
"use strict";

var valueMgr = require('fg-js/valueMgr');
var utils = require('fg-js/utils');

function render(context, data){
	var value = valueMgr.render(this, data, this.resolvedPath);
	return utils.renderTag({
		name: "span",
		attrs: this.attrs,
		innerHTML: value
	});
};

module.exports = render;
},{"fg-js/utils":28,"fg-js/valueMgr":31}],14:[function(require,module,exports){
function update(context, meta, scopePath, value){
	var node = meta.getDom()[0];
	if (!node){
		
	};
	node.innerHTML = value;
	//highlight(node, [0xffffff, 0xffee88], 500);
};

module.exports = update;
},{}],15:[function(require,module,exports){
"use strict";

var StrTpl = require('fg-js/strTpl.js');
var gapClassMgr = require('fg-js/client/gapClassMgr.js');

function render(context, data){
	var meta = this;
	var tpl = new StrTpl(meta.tpl);
	return tpl.render(function(path){
		var dataMeta = {
			"type": "data",
			"path": path			
		};
		var itemMeta = new gapClassMgr.Gap(context, dataMeta, meta.parent);
		return gapClassMgr.render(context, meta.parent, data, itemMeta);
	});
};

module.exports = render;
},{"fg-js/client/gapClassMgr.js":4,"fg-js/strTpl.js":26}],16:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],17:[function(require,module,exports){
var valueMgr = require('fg-js/valueMgr.js');
var utils = require('fg-js/utils');

function render(context, data){
	var self = this;
	this.parentFg = context;
	//this.renderedContent = context.renderTpl(this.content, meta, data);
	var fgClass = $fg.classes[this.fgName];
	var fgData = utils.deepClone(valueMgr.getValue(this, data, this.resolvedPath));	
	var fg = fgClass.render(fgData, this, context);
	fg.on('update', function(path, val){
		context.update(scopePath.concat(path), val);
		//console.log(path, val);
	});
	this.fg = fg;
	fg.meta = this;
	context.childFgs.push(fg);
	return fg;
	if (true){ // client
		
	};		
	throw 'todo server render';
};

module.exports = render;
},{"fg-js/utils":28,"fg-js/valueMgr.js":31}],18:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],19:[function(require,module,exports){
"use strict";

var utils = require('fg-js/utils');
var valueMgr = require('fg-js/valueMgr');
var StrTpl = require('fg-js/strTpl.js');

function render(context, data){
	var meta = this;
	if (meta.isScopeHolder){
		meta.root.currentScopeHolder = meta;		
	};
	var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
	var attrObj = {};
	attrsArr.forEach(function(attr){
		var name = new StrTpl(attr.name).render(valueMgr.resolveAndRender.bind(null, meta, data));
		var value = new StrTpl(attr.value).render(valueMgr.resolveAndRender.bind(null, meta, data));
		attrObj[name] = value;
	});
	var triggers = [];
	context.gapStorage.setTriggers(meta, triggers);
	// not using [data] rendering allow to have no extra <span> around data
	// var inner;	
	// if (meta.value){
	// 	var dataMeta = {
	// 		"type": "data",
	// 		"path": meta.value			
	// 	};
	// 	var itemMeta = new gapClassMgr.Gap(context, dataMeta, meta);
	// 	inner = gapClassMgr.render(context, meta, data, itemMeta);
	// }else{
	// 	inner = context.renderTpl(meta.content, meta, data);				
	// };
	var inner = meta.path 
		? valueMgr.getValue(meta, data, this.resolvedPath)
		: context.renderTpl(meta.content, meta, data);
	return utils.renderTag({
		"name": meta.tagName,
		"attrs": attrObj,
		"innerHTML": inner
	});
};

module.exports = render;
},{"fg-js/strTpl.js":26,"fg-js/utils":28,"fg-js/valueMgr":31}],20:[function(require,module,exports){
"use strict";

function update(context, meta, scopePath, value){
	// to do value update
	var valueMgr = require('fg-js/valueMgr');
	var utils = require('fg-js/utils');
	var StrTpl = require('fg-js/strTpl.js');

	/*var attrData = utils.objPath(meta.scopePath, context.data);
	var renderedAttrs = utils.renderAttrs(meta.attrs, attrData);*/
	var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
	var attrObj = {};
	attrsArr.forEach(function(attr){
		var name = new StrTpl(attr.name).render(valueMgr.render.bind(null, meta, context.data));
		var value = new StrTpl(attr.value).render(function(path){
			var resolvedPath = valueMgr.resolvePath(meta, path);		
			return valueMgr.render(meta, context.data, resolvedPath);
		});
		attrObj[name] = value;
	});
	var dom = meta.getDom()[0];
	if (meta.path && meta.path.path.join('-') === scopePath.join('-')){
		dom.innerHTML = meta.path.escaped 
			? utils.escapeHtml(value)
			: value;
	};
	utils.objFor(attrObj, function(value, name){
		var oldVal = dom.getAttribute(name);
		if (oldVal !== value){
			dom.setAttribute(name, value);
		};
	});		
};

module.exports = update;
},{"fg-js/strTpl.js":26,"fg-js/utils":28,"fg-js/valueMgr":31}],21:[function(require,module,exports){
var utils = require('fg-js/utils');		
var valueMgr = require('fg-js/valueMgr.js');

function render(context, data){
	var meta = this;
	var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
	this.scopePath = this.resolvedPath.path;
	if (!scopeData){
		return '';
	};
	return context.renderTpl(meta.content, meta, data);
};

module.exports = render;
},{"fg-js/utils":28,"fg-js/valueMgr.js":31}],22:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],23:[function(require,module,exports){
"use strict";

var anchorMgr = require('fg-js/anchorMgr.js');
var valueMgr = require('fg-js/valueMgr.js');
var renderScopeContent = require('./renderScopeContent.js');

function render(context, data){
	var meta = this;
	meta.items = [];
	var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
	this.scopePath = this.resolvedPath.path;
	var anchorCode = anchorMgr.genCode(context, meta);		
	var parts = renderScopeContent(context, meta, scopeData, data, 0);	
	return parts.join('\n') + anchorCode;
};

module.exports = render;
},{"./renderScopeContent.js":24,"fg-js/anchorMgr.js":1,"fg-js/valueMgr.js":31}],24:[function(require,module,exports){
"use strict";

var valueMgr = require('fg-js/valueMgr.js');
var gapClassMgr = require('fg-js/client/gapClassMgr.js');

function renderScopeContent(context, scopeMeta, scopeData, data, idOffset){
	var isArray = Array.isArray(scopeData);
	if (!isArray){
		scopeData = [scopeData];
	};
	var parts = scopeData.map(function(dataItem, id){
		var itemMeta = scopeMeta;
		var path = isArray
			? valueMgr.read([(id + idOffset).toString()])
			: valueMgr.read([]);
		var itemCfg = {
			"type": "scope-item",
			"isVirtual": true,
			"path": path,
			"content": scopeMeta.content
		};
		if (scopeMeta.eid){
			itemCfg.eid = scopeMeta.eid + '-item';
		};
		itemMeta = new gapClassMgr.Gap(context, itemCfg, itemMeta);		
		return gapClassMgr.render(context, scopeMeta, data, itemMeta);
	});
	return parts;
};

module.exports = renderScopeContent;
},{"fg-js/client/gapClassMgr.js":4,"fg-js/valueMgr.js":31}],25:[function(require,module,exports){
"use strict";

var renderScopeContent = require('./renderScopeContent.js');
var anchorMgr = require('fg-js/anchorMgr.js');

function update(context, meta, scopePath, value, oldValue){
	var utils = require('fg-js/utils');
	value = value || [];
	oldValue = oldValue || [];
	for (var i = value.length; i < oldValue.length; i++){
		context.gapStorage.removeScope(scopePath.concat([i]));
	};
	if (value.length > oldValue.length){
		var dataSlice = value.slice(oldValue.length);
		var newContent = renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
		var anchor = anchorMgr.find(context, meta);		
		anchorMgr.insertHTML(anchor, 'before', newContent);
	};
	//context.rerender(context.data);
};

module.exports = update;
},{"./renderScopeContent.js":24,"fg-js/anchorMgr.js":1,"fg-js/utils":28}],26:[function(require,module,exports){
"use strict";

function StrTpl(tpl, valueParseFn){
	if (typeof tpl === "object"){
		this.src = tpl.src;
		this.gaps = tpl.gaps;
		this.parts = tpl.parts;
		return;
	};
    this.src = tpl;
    this.parts = [];
    this.gaps = [];
    return this.parse(tpl, valueParseFn);
};

StrTpl.read = function(tpl, valueParseFn){
	var res = new StrTpl(tpl, valueParseFn);
	if (res.isString){
		res = tpl;
	};
	return res;
};

var gapRe = /[\$\#\!]{1}\{[^\}]*\}/gm;

StrTpl.prototype.parse = function(tpl, valueParseFn){
	var gapStrArr = tpl.match(gapRe);
	if (!gapStrArr){
		this.isString = true;
		this.parts = [tpl];
		return;
	};
	this.gaps = gapStrArr.map(function(part){
		var partValue = part.slice(2, -1);
		var partRes = valueParseFn(partValue);
		partRes.escaped = part[0] !== "!";
		return partRes;
	});		
	this.parts = tpl.split(gapRe);
	return this;
};

function mixArrays(/*arrays*/){
	var maxLength = 0;
	var totalLength = 0;
	for (var i = 0; i < arguments.length; i++){
		maxLength = Math.max(arguments[i].length, maxLength);
		totalLength += arguments[i].length;
	};
	var resArr = [];
	var arrayCount = arguments.length;
	for (var id = 0; id < maxLength; id++){				
		for (var j = 0; j < arrayCount; j++){
			if (arguments[j].length > id){
				resArr.push(arguments[j][id]);
			};
		};
	};
	return resArr;
};

StrTpl.prototype.render = function(valueRenderFn){
	var gaps = this.gaps.map(valueRenderFn);
	var parts = mixArrays(this.parts, gaps);
	return parts.join('');	
};

module.exports = StrTpl;
},{}],27:[function(require,module,exports){
var utils = require('fg-js/utils');

function renderTpl(tpl, parent, data, meta){
	var self = this;
	var parts = tpl.map(function(part, partId){
		if (typeof part == "string"){
			return part;
		};
		var partMeta = utils.simpleClone(part);
		if (meta){
			if (typeof meta == "function"){
				partMeta = meta(partMeta, partId);
			}else{
				partMeta = utils.extend(partMeta, meta || {});			
			};	
		};		
		return self.gapClassMgr.render(self.context, parent, data, partMeta);
	});
	var code = parts.join('');
	return code;
};

exports.renderTpl = renderTpl;
},{"fg-js/utils":28}],28:[function(require,module,exports){
"use strict";

var tplUtils = require('fg-js/utils/tplUtils.js');
var valueMgr = require('fg-js/valueMgr.js');
extend(exports, tplUtils);

function objFor(obj, fn){
	for (var i in obj){
		fn(obj[i], i, obj);
	};
};
exports.objFor = objFor;

function objMap(obj, fn){
	var newObj = {};
	objFor(obj, function(item, id){
		var newItem = fn(item, id, obj);
		newObj[id] = newItem;
	});
	return newObj;
};
exports.objMap = objMap;

function objPath(path, obj, newVal){
	if (path.length < 1){
		if (arguments.length > 2){
			throw 'root rewritting is not supported';
		};
		return obj;
	};
	var propName = path[0];
	if (path.length === 1){
		if (arguments.length > 2){
			obj[propName] = newVal; 
		};				
		return obj[propName];	
	};
	var subObj = obj[propName];
	if (subObj === undefined){
		//throw new Error("Cannot read " + propName + " of undefined");
		return undefined; // throw?
	};		
	if (arguments.length > 2){
		return objPath(path.slice(1), subObj, newVal);
	};
	return objPath(path.slice(1), subObj);
};
exports.objPath = objPath;


function attrsToObj(attrs){
	var res = {};
	attrs.forEach(function(i){
		res[i.name] = i.value;
	}); 
	return res;
};
exports.attrsToObj = attrsToObj;


function simpleClone(obj){
	var res = {};
	for (var i in obj){
		res[i] = obj[i];
	};
	return res;
};
exports.simpleClone = simpleClone;


function mixArrays(/*arrays*/){
	var id = 0;
	var maxLength = 0;
	var totalLength = 0;
	for (var i = 0; i < arguments.length; i++){
		maxLength = Math.max(arguments[i].length, maxLength);
		totalLength += arguments[i].length;
	};
	var resArr = [];
	var arrayCount = arguments.length;
	for (var id = 0; id < maxLength; id++){				
		for (var i = 0; i < arrayCount; i++){
			if (arguments[i].length > id){
				resArr.push(arguments[i][id]);
			};
		};
	};
	return resArr;
};
exports.mixArrays = mixArrays;

function resolvePath(rootPath, relPath){
	var resPath = rootPath.slice();
	relPath = relPath || [];
	relPath.forEach(function(key){
		if (key === "_root"){
			resPath = [];
			return;
		};
		resPath.push(key);
	});
	return resPath;
};
exports.resolvePath = resolvePath;


function getScopePath(meta){
	var	parentPath = [];
	if (meta.parent){
		parentPath = meta.parent.scopePath;
		if (!parentPath){
			throw new Error("Parent elm must have scopePath");
		};
	};
	return resolvePath(parentPath, meta.path);
};
exports.getScopePath = getScopePath;

function keyValueToObj(arr, keyName, valueName){
	keyName = keyName || 'key';
	valueName = valueName || 'value';
	var res = {};
	arr.forEach(function(i){
		res[i[keyName]] = i[valueName];
	}); 
	return res;
};
exports.keyValueToObj = keyValueToObj;	

function objToKeyValue(obj, keyName, valueName){
	keyName = keyName || 'key';
	valueName = valueName || 'value';
	var res = [];
	for (var i in obj){
		var item = {};
		item[keyName] = i;
		item[valueName] = obj[i];
		res.push(item);
	};
	return res;
};
exports.objToKeyValue = objToKeyValue;

function clone(obj){
	return Object.create(obj);
};
exports.clone = clone;


function concatObj(obj1, obj2){
	var res = simpleClone(obj1);
	for (var i in obj2){
		res[i] = obj2[i];
	};
	return res;
};
exports.concatObj = concatObj;

function extend(dest, src){	
	for (var i in src){
		dest[i] = src[i];
	};
	return dest;
};
exports.extend = extend;

function findScopeHolder(meta){
    var node = meta.parent;
    while (node){
        if (!node.isScopeHolder){
            return node;
        };
        node = node.parent;  
    };
    throw new Error('cannot find scope holder');
};
exports.findScopeHolder = findScopeHolder;

function renderScopeContent(context, scopeMeta, scopeData, data, idOffset){
	var gapClassMgr = require('fg-js/client/gapClassMgr.js');
	var isArray = Array.isArray(scopeData);
	if (!isArray){
		scopeData = [scopeData];
	};
	var parts = scopeData.map(function(dataItem, id){
		var itemMeta = scopeMeta;
		if (isArray){
			var itemCfg = {
				"type": "scope-item",
				"isVirtual": true,
				"path": [id + idOffset],
				"content": scopeMeta.content
			};
			if (scopeMeta.eid){
				itemCfg.eid = scopeMeta.eid + '-item';
			};
			itemMeta = new gapClassMgr.Gap(context, itemCfg, itemMeta);
			context.gapStorage.setTriggers(itemMeta, [itemMeta.scopePath]);
		};
		return gapClassMgr.render(context, scopeMeta, data, itemMeta);
	});
	return parts;
};
exports.renderScopeContent = renderScopeContent;

function insertHTMLBeforeComment(commentElm, html){
	var prev = commentElm.previousElementSibling;
	if (prev){
		prev.insertAdjacentHTML('afterend', html);
		return;
	};
	commentElm.parentNode.insertAdjacentHTML('afterbegin', html);
};
exports.insertHTMLBeforeComment = insertHTMLBeforeComment;


function parsePath(parsedNode){
	if (parsedNode.attrs.class){
		var parts = parsedNode.attrs.class.value.split(' ');
		var parsed =  valueMgr.read(parts);
		return parsed;
	};
	return valueMgr.read([]);
};
exports.parsePath = parsePath;

function objMap(obj, fn){
	var res = {};
	objFor(obj, function(val, id){
		res[id] = fn(val, id, obj);
	});
	return res;
};
exports.objMap = objMap;

function deepClone(obj){
	if (typeof obj === "object"){
		var map = Array.isArray(obj)
			? obj.map.bind(obj)
			: objMap.bind(null, obj);
		return map(deepClone);
	};
	return obj;
};
exports.deepClone = deepClone;

function getAttrsPaths(attrs){
	var paths = [];
	objFor(attrs, function(value, name){
		var nameTpl = new StrTpl(name);
		var valueTpl = new StrTpl(value);
		paths = paths.concat(nameTpl.getPaths(), valueTpl.getPaths());		
	});
	return paths;
};
exports.getAttrsPaths = getAttrsPaths;

function escapeHtml(code){
	return code
		.replace(/"/g,'&quot;')
		.replace(/&/g,'&amp;')
		.replace(/</g,'&lt;')
		.replace(/>/g,'&gt;');
};
exports.escapeHtml = escapeHtml;
},{"fg-js/client/gapClassMgr.js":4,"fg-js/utils/tplUtils.js":29,"fg-js/valueMgr.js":31}],29:[function(require,module,exports){
var utils = require('fg-js/utils.js');

var selfClosingTags = ["area", "base", "br", "col", 
	"command", "embed", "hr", "img", 
	"input", "keygen", "link", 
	"meta", "param", "source", "track", 
	"wbr"];

function renderTag(tagInfo){
	var attrs = tagInfo.attrs;
	if (!Array.isArray(attrs)){
		attrs = utils.objToKeyValue(attrs, 'name', 'value');
	};
	var attrCode = "";
	if (attrs.length > 0){
	    attrCode = " " + attrs.map(function(attr){
		  return attr.name + '="' + attr.value + '"';
	   }).join(' ');
	};
	var tagHead = tagInfo.name + attrCode;
	if (~selfClosingTags.indexOf(tagInfo.name)){
		return "<" + tagHead + " />";
	};
	var openTag = "<" + tagHead + ">";
	var closeTag = "</" + tagInfo.name + ">";
	var code = openTag + (tagInfo.innerHTML || "") + closeTag;
	return code;
};
exports.renderTag = renderTag;	


},{"fg-js/utils.js":28}],30:[function(require,module,exports){
function Node(kind, parent, data){
    this.children = kind == 'array'
        ? []
        : {};   
    this.parent = parent;
    this.data = data;
    this.childCount = 0;
};

Node.prototype.addChild = function(name, data){
    if (this.kind == 'array'){
        data = name;
        name = this.children.length;
    };
    data = data || this.root.initNode();
    var child = new Node(this.kind, this, data);
    child.id = name;
    child.path = this.path.concat([name]);
    child.root = this.root;
    this.childCount++;
    this.children[name] = child;
    return child;
};

Node.prototype.getParents = function(){
    var res = [];    
    var node = this;
    while (true){
        node = node.parent;
        if (!node){
            return res;
        };
        res.push(node);
    };  
};

Node.prototype.childIterate = function(fn){
    for (var i in this.children){
        fn.call(this, this.children[i], i);  
    };
};

Node.prototype.getChildArr = function(){
    if (this.kind == 'array'){
        return this.children;
    };
    var res = [];
    this.childIterate(function(child){
        res.push(child);
    });            
    return res;
};

Node.prototype.getDeepChildArr = function(){
    var res = this.getChildArr();
    this.childIterate(function(child){
       res = res.concat(child.getDeepChildArr());
    });
    return res;
};

Node.prototype.remove = function(path){
    var leafKey = path[path.length - 1];
    var branchPath = path.slice(0, -1);
    var branch = this.byPath(branchPath);
    branch.childCount--;
    var res = branch.children[leafKey];
    delete branch.children[leafKey];   
    return res; 
};

Node.prototype.byPath = function(path){    
    if (path.length == 0){
        return this;
    };
    var node = this;
    while (true){
        var key = path[0];
        node = node.children[key];
        if (!node){
            return null;
        };
        path = path.slice(1);
        if (path.length == 0){
            return node;  
        };
    };
};

Node.prototype.access = function(path){
    if (path.length == 0){
        return this;
    };
    var node = this;
    while (true){
        var key = path[0];
        var parent = node;
        node = node.children[key];
        if (!node){
            var data = this.root.initNode();                
            node = parent.addChild(key, data);
            parent.children[key] = node;
        };
        path = path.slice(1);
        if (path.length == 0){
            return node;  
        };
    }; 
};

function TreeHelper(opts, rootData){
    opts = opts || {};
    opts.kind = opts.kind || 'array';
    var initNode = opts.initNode || function(){
        return {};
    };
    var data = rootData || initNode();
    var rootNode = new Node(opts.kind, null, data);
    rootNode.isRoot = true;
    rootNode.root = rootNode;
    rootNode.path = [];
    rootNode.initNode = initNode;
    return rootNode;
};

module.exports = TreeHelper;
},{}],31:[function(require,module,exports){
"use strict";

var utils = require('fg-js/utils');

function read(parts, extraInfo){
	var source = "data";
	var path = parts.map(function(part){		
		if (part[0] === '$'){
			return {
				op: part.slice(1)
			};
		};
		return part; 
	});
	var res = {
		"source": source,
		"path": path
	};
	if (extraInfo){
		utils.extend(res, extraInfo);
	};
	return res;
};
exports.read = read;

function parse(str, extraInfo){
	var parts = str.trim().split('.');
	return read(parts, extraInfo);
};
exports.parse = parse;

function findScopePath(meta){
	var parent = meta.parent;
	while (true){		
		if (!parent){
			return [];
		};
		if (parent.scopePath){
			return parent.scopePath;
		};
		parent = parent.parent;
	};
};

function resolvePath(meta, path){
	var scopePath = findScopePath(meta);
	var res = {
		source: "data",
		escaped: path.escaped
	};
	res.path = scopePath.slice();
	path.path.forEach(function(key){
		if (typeof key === "string"){
			res.path.push(key);			
			return;
		};
		if (key.op === "root"){
			res.path = [];
		} else if (key.op === "up"){
			res.path.pop();
		};
	});
	return res;
};
exports.resolvePath = resolvePath;

function getValue(meta, data, gapInfo){
	var sourceTable = {
		"data": data,
		"meta": meta
	};
	var sourceData = sourceTable[gapInfo.source];
	var res = utils.objPath(gapInfo.path, sourceData);
	if (gapInfo.escaped){
		res = utils.escapeHtml(res);		
	};
	return res;
};
exports.getValue = getValue;

function render(meta, data, resolvedPath){
	return getValue(meta, data, resolvedPath).toString();
};
exports.render = render;

function resolveAndRender(meta, data, path){
	var resolvedPath = resolvePath(meta, path);
	return render(meta, data, resolvedPath);
};
exports.resolveAndRender = resolveAndRender;

},{"fg-js/utils":28}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9mZy1qcy9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2FuY2hvck1nci5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9jbGllbnQvZmdDbGFzcy5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9jbGllbnQvZmdJbnN0YW5jZS5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9jbGllbnQvZ2FwQ2xhc3NNZ3IuanMiLCJub2RlX21vZHVsZXMvZmctanMvY2xpZW50L2dhcFN0b3JhZ2UuanMiLCJub2RlX21vZHVsZXMvZmctanMvY2xpZW50L2dhcHMuanMiLCJub2RlX21vZHVsZXMvZmctanMvY2xpZW50L2dsb2JhbEV2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9jbGllbnQvaGVscGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2NsaWVudC9tYWluLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2V2ZW50RW1pdHRlci5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9nYXBzL2NvbnRlbnQvcmVuZGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2dhcHMvY29udGVudC91cGRhdGUuanMiLCJub2RlX21vZHVsZXMvZmctanMvZ2Fwcy9kYXRhL3JlbmRlci5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9nYXBzL2RhdGEvdXBkYXRlLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2dhcHMvZHluYW1pYy10ZXh0L3JlbmRlci5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9nYXBzL2ZnL3JlbmRlci5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9nYXBzL3Jhdy9yZW5kZXIuanMiLCJub2RlX21vZHVsZXMvZmctanMvZ2Fwcy9yYXcvdXBkYXRlLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2dhcHMvc2NvcGUtaXRlbS9yZW5kZXIuanMiLCJub2RlX21vZHVsZXMvZmctanMvZ2Fwcy9zY29wZS9yZW5kZXIuanMiLCJub2RlX21vZHVsZXMvZmctanMvZ2Fwcy9zY29wZS9yZW5kZXJTY29wZUNvbnRlbnQuanMiLCJub2RlX21vZHVsZXMvZmctanMvZ2Fwcy9zY29wZS91cGRhdGUuanMiLCJub2RlX21vZHVsZXMvZmctanMvc3RyVHBsLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL3RwbFJlbmRlci5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy91dGlscy90cGxVdGlscy5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy91dGlscy90cmVlSGVscGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL3ZhbHVlTWdyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmZ1bmN0aW9uIGdlbklkKGNvbnRleHQsIGdhcCl7XHJcbiAgIFx0dmFyIGlkID0gWydmZycsIGNvbnRleHQuaWQsICdhaWQnLCBnYXAuZ2lkXS5qb2luKCctJyk7XHJcbiAgICByZXR1cm4gaWQ7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBnZW5Db2RlKGNvbnRleHQsIGdhcCl7XHJcbiAgICB2YXIgY29kZSA9ICc8c2NyaXB0IHR5cGU9XCJmZy1qcy9hbmNob3JcIiBpZD1cIicgXHJcbiAgICAgICAgKyBnZW5JZChjb250ZXh0LCBnYXApIFxyXG4gICAgICAgICsgJ1wiPjwvc2NyaXB0Pic7XHJcbiAgICByZXR1cm4gY29kZTtcclxufTtcclxuZXhwb3J0cy5nZW5Db2RlID0gZ2VuQ29kZTtcclxuXHJcbmZ1bmN0aW9uIGZpbmQoY29udGV4dCwgZ2FwKXtcclxuICAgXHR2YXIgaWQgPSBnZW5JZChjb250ZXh0LCBnYXApOyAgICBcclxuICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbn07XHJcbmV4cG9ydHMuZmluZCA9IGZpbmQ7XHJcblxyXG5mdW5jdGlvbiBpbnNlcnRIVE1MKGFuY2hvciwgcG9zaXRpb24sIGh0bWwpe1xyXG4gICBcdHZhciBwb3NUYWJsZSA9IHtcclxuICAgICAgICAgICBcImJlZm9yZVwiOiBcImJlZm9yZWJlZ2luXCIsXHJcbiAgICAgICAgICAgXCJhZnRlclwiOiBcImFmdGVyZW5kXCJcclxuICAgIH07XHJcbiAgICB2YXIgcG9zID0gcG9zVGFibGVbcG9zaXRpb25dO1xyXG4gICAgYW5jaG9yLmluc2VydEFkamFjZW50SFRNTChwb3MsIGh0bWwpO1xyXG59O1xyXG5leHBvcnRzLmluc2VydEhUTUwgPSBpbnNlcnRIVE1MO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdmZy1qcy9ldmVudEVtaXR0ZXIuanMnKTtcclxudmFyIGdsb2JhbEV2ZW50cyA9IHJlcXVpcmUoJ2ZnLWpzL2NsaWVudC9nbG9iYWxFdmVudHMuanMnKTtcclxudmFyIGZnSW5zdGFuY2VNb2R1bGUgPSByZXF1aXJlKCdmZy1qcy9jbGllbnQvZmdJbnN0YW5jZS5qcycpO1xyXG5cclxudmFyIGZnQ2xhc3NUYWJsZSA9IFtdO1xyXG52YXIgZmdDbGFzc0RpY3QgPSB7fTtcclxuXHJcbmZ1bmN0aW9uIEZnQ2xhc3Mob3B0cyl7XHJcblx0dGhpcy5pZCA9IGZnQ2xhc3NUYWJsZS5sZW5ndGg7XHRcclxuXHR0aGlzLmluc3RhbmNlcyA9IFtdO1xyXG5cdHRoaXMudHBsID0gb3B0cy50cGw7XHJcblx0dGhpcy5uYW1lID0gb3B0cy5uYW1lO1xyXG5cdHRoaXMuZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG5cdGZnQ2xhc3NEaWN0W29wdHMubmFtZV0gPSB0aGlzO1xyXG5cdGZnQ2xhc3NUYWJsZS5wdXNoKHRoaXMpO1x0XHJcblx0ZnVuY3Rpb24gRmdJbnN0YW5jZSgpe1xyXG5cdFx0ZmdJbnN0YW5jZU1vZHVsZS5GZ0luc3RhbmNlQmFzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdH07XHJcblx0dGhpcy5jcmVhdGVGbiA9IEZnSW5zdGFuY2U7XHJcblx0dGhpcy5jcmVhdGVGbi5jb25zdHJ1Y3RvciA9IGZnSW5zdGFuY2VNb2R1bGUuRmdJbnN0YW5jZUJhc2U7XHRcclxuXHR0aGlzLmNyZWF0ZUZuLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoZmdJbnN0YW5jZU1vZHVsZS5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUpO1x0XHJcblx0dmFyIGNsYXNzRm4gPSBvcHRzLmNsYXNzRm47XHJcblx0aWYgKGNsYXNzRm4pe1xyXG5cdFx0Y2xhc3NGbih0aGlzLCB0aGlzLmNyZWF0ZUZuLnByb3RvdHlwZSk7XHJcblx0fTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG1hdGNoKGZnLCBub2RlLCBzZWxlY3Rvcil7XHJcblx0dmFyIGRvbUVsbXMgPSBmZy5nZXREb20oKTtcclxuXHR3aGlsZSAobm9kZSl7XHJcblx0XHRpZiAobm9kZS5tYXRjaGVzKHNlbGVjdG9yKSl7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fTtcclxuXHRcdGlmIChkb21FbG1zLmluZGV4T2Yobm9kZSkgPj0gMCl7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH07XHRcdFxyXG5cdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcclxuXHR9O1xyXG5cdHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbkZnQ2xhc3MucHJvdG90eXBlLm9uID0gZnVuY3Rpb24obmFtZSwgc2VsZWN0b3IsIGZuKXtcdFxyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKXtcclxuXHRcdG5hbWUgPSBuYW1lO1xyXG5cdFx0Zm4gPSBhcmd1bWVudHNbMV07XHJcblx0XHRzZWxlY3RvciA9IG51bGw7XHJcblx0fWVsc2V7XHJcblx0XHR2YXIgb3JpZ2luYWxGbiA9IGZuO1xyXG5cdFx0Zm4gPSBmdW5jdGlvbihldmVudCl7XHRcdFx0XHJcblx0XHRcdGlmIChtYXRjaCh0aGlzLCBldmVudC50YXJnZXQsIHNlbGVjdG9yKSl7XHJcblx0XHRcdFx0b3JpZ2luYWxGbi5jYWxsKHRoaXMsIGV2ZW50KTtcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0fTtcclxuXHRnbG9iYWxFdmVudHMubGlzdGVuKG5hbWUpO1xyXG5cdHRoaXMuZXZlbnRFbWl0dGVyLm9uKG5hbWUsIGZuKTtcdFxyXG59O1xyXG5cclxuRmdDbGFzcy5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKC8qbmFtZS4uLiwgcmVzdCovKXtcclxuXHR0aGlzLmV2ZW50RW1pdHRlci5lbWl0LmFwcGx5KHRoaXMuZXZlbnRFbWl0dGVyLCBhcmd1bWVudHMpO1x0XHJcbn07XHJcblxyXG5GZ0NsYXNzLnByb3RvdHlwZS5lbWl0QXBwbHkgPSBmdW5jdGlvbihuYW1lLCB0aGlzQXJnLCBhcmdzKXtcclxuXHR0aGlzLmV2ZW50RW1pdHRlci5lbWl0QXBwbHkobmFtZSwgdGhpc0FyZywgYXJncyk7XHRcclxufTtcclxuXHJcbkZnQ2xhc3MucHJvdG90eXBlLmNvb2tEYXRhID0gZnVuY3Rpb24oZGF0YSl7XHJcblx0cmV0dXJuIGRhdGE7XHJcbn07XHJcblxyXG5GZ0NsYXNzLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihkYXRhLCBtZXRhLCBwYXJlbnQpe1xyXG5cdGlmIChkYXRhIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpe1xyXG5cdFx0cmV0dXJuIHRoaXMucmVuZGVySW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHR9O1xyXG5cdHZhciBmZyA9IG5ldyBmZ0luc3RhbmNlTW9kdWxlLkZnSW5zdGFuY2UodGhpcywgcGFyZW50KTtcclxuXHRmZy5jb2RlID0gZmcuZ2V0SHRtbChkYXRhLCBtZXRhKTtcclxuXHRyZXR1cm4gZmc7XHJcbn07XHJcblxyXG5GZ0NsYXNzLnByb3RvdHlwZS5yZW5kZXJJbiA9IGZ1bmN0aW9uKHBhcmVudE5vZGUsIGRhdGEsIG1ldGEsIHBhcmVudCl7XHJcblx0dmFyIGZnID0gdGhpcy5yZW5kZXIoZGF0YSwgbWV0YSwgcGFyZW50KTtcclxuXHRwYXJlbnROb2RlLmlubmVySFRNTCA9IGZnLmNvZGU7XHJcblx0ZmcuYXNzaWduKCk7XHJcblx0cmV0dXJuIGZnO1xyXG59O1xyXG5cclxuRmdDbGFzcy5wcm90b3R5cGUuYXBwZW5kVG8gPSBmdW5jdGlvbihwYXJlbnROb2RlLCBkYXRhKXtcclxuXHR2YXIgZmcgPSB0aGlzLnJlbmRlcihkYXRhKTtcdFxyXG5cdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRkaXYuaW5uZXJIVE1MID0gZmcuY29kZTtcclxuXHRbXS5zbGljZS5jYWxsKGRpdi5jaGlsZHJlbikuZm9yRWFjaChmdW5jdGlvbihjaGlsZCl7XHJcblx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuXHR9KTtcclxuXHRmZy5hc3NpZ24oKTtcclxufTtcclxuXHJcbmV4cG9ydHMuRmdDbGFzcyA9IEZnQ2xhc3M7XHJcbmV4cG9ydHMuZmdDbGFzc0RpY3QgPSBmZ0NsYXNzRGljdDtcclxuZXhwb3J0cy5mZ0NsYXNzVGFibGUgPSBmZ0NsYXNzVGFibGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgZ2FwQ2xhc3NNZ3IgPSByZXF1aXJlKCdmZy1qcy9jbGllbnQvZ2FwQ2xhc3NNZ3IuanMnKTtcclxudmFyIHJlbmRlclRwbCA9IHJlcXVpcmUoJ2ZnLWpzL3RwbFJlbmRlci5qcycpLnJlbmRlclRwbDtcclxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJy4uL2V2ZW50RW1pdHRlci5qcycpO1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCdmZy1qcy91dGlscy5qcycpO1xyXG52YXIgR2FwU3RvcmFnZSA9IHJlcXVpcmUoJ2ZnLWpzL2NsaWVudC9nYXBTdG9yYWdlLmpzJykuR2FwU3RvcmFnZTtcclxudmFyIGhlbHBlciA9IHJlcXVpcmUoJy4vaGVscGVyLmpzJyk7XHJcbnZhciBnbG9iYWxFdmVudHMgPSByZXF1aXJlKCdmZy1qcy9jbGllbnQvZ2xvYmFsRXZlbnRzLmpzJyk7XHJcblxyXG52YXIgZmdJbnN0YW5jZVRhYmxlID0gW107XHJcblxyXG5mdW5jdGlvbiBGZ0luc3RhbmNlQmFzZShmZ0NsYXNzLCBwYXJlbnQpe1xyXG5cdHRoaXMuaWQgPSBmZ0luc3RhbmNlVGFibGUubGVuZ3RoO1xyXG5cdGZnQ2xhc3MuaW5zdGFuY2VzLnB1c2godGhpcyk7XHJcblx0dGhpcy5uYW1lID0gZmdDbGFzcy5uYW1lO1xyXG5cdHRoaXMuZmdDbGFzcyA9IGZnQ2xhc3M7XHJcblx0dGhpcy5jb2RlID0gbnVsbDtcclxuXHR0aGlzLnBhcmVudCA9IHBhcmVudCB8fCBudWxsO1xyXG5cdHRoaXMuZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcihmZ0NsYXNzLmV2ZW50RW1pdHRlcik7XHJcblx0dGhpcy5lbWl0QXBwbHkgPSB0aGlzLmV2ZW50RW1pdHRlci5lbWl0QXBwbHkuYmluZCh0aGlzLmV2ZW50RW1pdHRlcik7XHJcblx0dGhpcy5nYXBTdG9yYWdlID0gbmV3IEdhcFN0b3JhZ2UodGhpcyk7XHJcblx0dGhpcy5jaGlsZEZncyA9IFtdO1xyXG5cdGZnSW5zdGFuY2VUYWJsZS5wdXNoKHRoaXMpO1x0XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudCwgZm4pe1xyXG5cdGdsb2JhbEV2ZW50cy5saXN0ZW4oZXZlbnQpO1xyXG5cdHRoaXMuZXZlbnRFbWl0dGVyLm9uKGV2ZW50LCBmbik7XHRcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oLypuYW1lLi4uLCByZXN0Ki8pe1xyXG5cdHRoaXMuZXZlbnRFbWl0dGVyLmVtaXQuYXBwbHkodGhpcy5ldmVudEVtaXR0ZXIsIGFyZ3VtZW50cyk7XHRcclxufTtcclxuXHJcbmZ1bmN0aW9uIEZnSW5zdGFuY2UoZmdDbGFzcywgcGFyZW50KXtcclxuXHRyZXR1cm4gbmV3IGZnQ2xhc3MuY3JlYXRlRm4oZmdDbGFzcywgcGFyZW50KTtcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHRoaXMuY29kZTtcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5hc3NpZ24gPSBmdW5jdGlvbigpe1xyXG5cdHRoaXMuZW1pdEFwcGx5KCdyZWFkeScsIHRoaXMsIFtdKTtcclxuXHR0aGlzLmRvbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZy1paWQtJyArIHRoaXMuaWQpO1xyXG5cdHRoaXMuZ2FwU3RvcmFnZS5hc3NpZ24oKTtcclxuXHRyZXR1cm4gdGhpcy5kb207XHJcbn07XHJcblxyXG5mdW5jdGlvbiBnZXRDbGFzc2VzKG1ldGEpe1xyXG5cdGlmICghbWV0YSB8fCAhbWV0YS5hdHRycyB8fCAhbWV0YS5hdHRycy5jbGFzcyl7XHJcblx0XHRyZXR1cm4gW107XHJcblx0fTtcclxuXHRpZiAoQXJyYXkuaXNBcnJheShtZXRhLmF0dHJzLmNsYXNzKSl7XHJcblx0XHRyZXR1cm4gbWV0YS5hdHRycy5jbGFzcztcclxuXHR9O1x0XHRcclxuXHRyZXR1cm4gbWV0YS5hdHRycy5jbGFzcy5zcGxpdCgnICcpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gbWV0YU1hcChmZywgbWV0YVBhcnQpe1xyXG5cdHZhciByZXMgPSB1dGlscy5zaW1wbGVDbG9uZShtZXRhUGFydCk7XHJcblx0dmFyIGNsYXNzZXMgPSBnZXRDbGFzc2VzKHJlcyk7XHJcblx0dmFyIGZnX2NpZCA9IFwiZmctY2lkLVwiICsgZmcuZmdDbGFzcy5pZDtcclxuXHRyZXMuYXR0cnMgPSB1dGlscy5zaW1wbGVDbG9uZShtZXRhUGFydC5hdHRycyk7XHJcblx0aWYgKEFycmF5LmlzQXJyYXkocmVzLmF0dHJzLmNsYXNzKSl7XHJcblx0XHRyZXMuYXR0cnMuY2xhc3MgPSBbJ2ZnJywgJyAnLCBmZ19jaWQsICcgJ10uY29uY2F0KGNsYXNzZXMpO1xyXG5cdFx0cmV0dXJuIHJlcztcdFxyXG5cdH07XHRcclxuXHRyZXMuYXR0cnMuY2xhc3MgPSBbJ2ZnJywgZmdfY2lkXS5jb25jYXQoY2xhc3Nlcykuam9pbignICcpO1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUucmVuZGVyVHBsID0gZnVuY3Rpb24odHBsLCBwYXJlbnQsIGRhdGEsIG1ldGEpe1xyXG5cdHJldHVybiByZW5kZXJUcGwuY2FsbCh7XHJcblx0XHRcImdhcENsYXNzTWdyXCI6IGdhcENsYXNzTWdyLFxyXG5cdFx0XCJjb250ZXh0XCI6IHRoaXNcclxuXHR9LCB0cGwsIHBhcmVudCwgZGF0YSwgbWV0YSk7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuZ2V0SHRtbCA9IGZ1bmN0aW9uKGRhdGEsIG1ldGEpe1xyXG5cdHRoaXMuZGF0YSA9IGRhdGE7XHJcblx0dGhpcy5nYXBNZXRhID0gbWV0YTtcclxuXHR2YXIgcm9vdEdhcCA9IG5ldyBnYXBDbGFzc01nci5HYXAodGhpcywgbWV0YSk7XHJcblx0cm9vdEdhcC50eXBlID0gXCJyb290XCI7XHJcblx0cm9vdEdhcC5pc1ZpcnR1YWwgPSB0cnVlO1xyXG5cdHJvb3RHYXAuZmcgPSB0aGlzO1xyXG5cdHJvb3RHYXAuc2NvcGVQYXRoID0gW107XHJcblx0dGhpcy5tZXRhID0gcm9vdEdhcDtcclxuXHR2YXIgY29va2VkRGF0YSA9IHRoaXMuZmdDbGFzcy5jb29rRGF0YShkYXRhKTtcclxuXHRyZXR1cm4gdGhpcy5yZW5kZXJUcGwodGhpcy5mZ0NsYXNzLnRwbCwgcm9vdEdhcCwgY29va2VkRGF0YSwgbWV0YU1hcC5iaW5kKG51bGwsIHRoaXMpKTtcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihzY29wZVBhdGgsIG5ld1ZhbHVlKXtcclxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCl7XHJcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoW10sIHRoaXMuZGF0YSk7IC8vIHRvZG9cclxuXHR9O1xyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKXtcclxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZShbXSwgYXJndW1lbnRzWzBdKTtcclxuXHR9O1xyXG5cdHZhciB2YWx1ZSA9IHV0aWxzLmRlZXBDbG9uZShuZXdWYWx1ZSk7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBvbGRWYWx1ZSA9IHV0aWxzLm9ialBhdGgoc2NvcGVQYXRoLCB0aGlzLmRhdGEpO1xyXG5cdGlmIChvbGRWYWx1ZSA9PT0gdmFsdWUpe1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fTtcdFxyXG5cdHRoaXMuZW1pdCgndXBkYXRlJywgc2NvcGVQYXRoLCBuZXdWYWx1ZSk7XHJcblx0aWYgKHNjb3BlUGF0aC5sZW5ndGggPiAwKXtcclxuXHRcdHV0aWxzLm9ialBhdGgoc2NvcGVQYXRoLCB0aGlzLmRhdGEsIHZhbHVlKTtcclxuXHR9ZWxzZXtcclxuXHRcdHRoaXMuZGF0YSA9IHZhbHVlO1xyXG5cdH1cclxuXHR2YXIgc2NvcGUgPSB0aGlzLmdhcFN0b3JhZ2UuYnlTY29wZShzY29wZVBhdGgpO1xyXG5cdHZhciBnYXBzID0gc2NvcGUudGFyZ2V0O1xyXG5cdGdhcHMuZm9yRWFjaChmdW5jdGlvbihnYXApe1xyXG5cdFx0Z2FwQ2xhc3NNZ3IudXBkYXRlKHNlbGYsIGdhcCwgc2NvcGVQYXRoLCB2YWx1ZSwgb2xkVmFsdWUpO1xyXG5cdH0pO1xyXG5cdHNjb3BlLnBhcmVudHMuZm9yRWFjaChmdW5jdGlvbihwYXJlbnROb2RlKXtcclxuXHRcdHBhcmVudE5vZGUuZGF0YS5nYXBzLmZvckVhY2goZnVuY3Rpb24ocGFyZW50R2FwKXtcclxuXHRcdFx0aWYgKHBhcmVudEdhcC50eXBlID09PSBcImZnXCIpe1xyXG5cdFx0XHRcdHZhciBzdWJQYXRoID0gc2NvcGVQYXRoLnNsaWNlKHBhcmVudEdhcC5zY29wZVBhdGgubGVuZ3RoKTtcclxuXHRcdFx0XHQvL3ZhciBzdWJWYWwgPSB1dGlscy5vYmpQYXRoKHN1YlBhdGgsIHNlbGYuZGF0YSk7XHJcblx0XHRcdFx0cGFyZW50R2FwLmZnLnVwZGF0ZShzdWJQYXRoLCBuZXdWYWx1ZSk7XHJcblx0XHRcdH07XHRcdFx0XHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHRzY29wZS5zdWJzLmZvckVhY2goZnVuY3Rpb24oc3ViKXtcclxuXHRcdHZhciBzdWJWYWwgPSB1dGlscy5vYmpQYXRoKHN1Yi5wYXRoLCBzZWxmLmRhdGEpO1x0XHJcblx0XHR2YXIgc3ViUGF0aCA9IHN1Yi5wYXRoLnNsaWNlKHNjb3BlUGF0aC5sZW5ndGgpO1xyXG5cdFx0dmFyIG9sZFN1YlZhbCA9IHV0aWxzLm9ialBhdGgoc3ViUGF0aCwgb2xkVmFsdWUpO1xyXG5cdFx0aWYgKHN1YlZhbCA9PT0gb2xkU3ViVmFsKXtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fTtcclxuXHRcdHN1Yi5nYXBzLmZvckVhY2goZnVuY3Rpb24oZ2FwKXtcclxuXHRcdFx0aWYgKHNlbGYuZ2FwU3RvcmFnZS5nYXBzLmluZGV4T2YoZ2FwKSA8IDApe1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fTtcclxuXHRcdFx0Z2FwQ2xhc3NNZ3IudXBkYXRlKHNlbGYsIGdhcCwgc3ViLnBhdGgsIHN1YlZhbCwgb2xkU3ViVmFsKTtcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlU2NvcGVIZWxwZXIoZmcsIG9iaiwgc2NvcGVQYXRoKXtcclxuXHR2YXIgaGVscGVyID0gQXJyYXkuaXNBcnJheShvYmopIFxyXG5cdFx0PyBbXSBcclxuXHRcdDoge307XHJcblx0dXRpbHMub2JqRm9yKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSl7XHJcblx0XHR2YXIgcHJvcFNjb3BlUGF0aCA9IHNjb3BlUGF0aC5jb25jYXQoW2tleV0pO1xyXG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGhlbHBlciwga2V5LCB7XHJcblx0XHRcdGdldDogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKXtcclxuXHRcdFx0XHRcdHJldHVybiBjcmVhdGVTY29wZUhlbHBlcihmZywgb2JqW2tleV0sIHByb3BTY29wZVBhdGgpO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0cmV0dXJuIG9ialtrZXldO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRzZXQ6IGZ1bmN0aW9uKHZhbCl7XHJcblx0XHRcdFx0ZmcudXBkYXRlKHByb3BTY29wZVBhdGgsIHZhbCk7XHRcdFx0XHRcclxuXHRcdFx0fVx0XHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHRyZXR1cm4gaGVscGVyO1xyXG59O1xyXG5cclxuRmdJbnN0YW5jZUJhc2UucHJvdG90eXBlLiRkID0gZnVuY3Rpb24oKXtcclxuXHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuJGRhdGEgPSBmdW5jdGlvbihuZXdEYXRhKXtcclxuXHRpZiAobmV3RGF0YSl7XHJcblx0XHQvLy4uLlxyXG5cdFx0cmV0dXJuO1xyXG5cdH07XHJcblx0dmFyIGhlbHBlciA9IGNyZWF0ZVNjb3BlSGVscGVyKHRoaXMsIHRoaXMuZGF0YSwgW10pO1xyXG5cdHJldHVybiBoZWxwZXI7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuY2xvbmVEYXRhID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gdXRpbHMuZGVlcENsb25lKHRoaXMuZGF0YSk7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpe1xyXG5cdHRoaXMuY2hpbGRGZ3MuZm9yRWFjaChmdW5jdGlvbihjaGlsZCl7XHJcblx0XHRjaGlsZC5yZW1vdmUodHJ1ZSk7XHJcblx0fSk7XHJcblx0dGhpcy5jb2RlID0gJyc7XHJcblx0dGhpcy5kYXRhID0gbnVsbDtcclxuXHR0aGlzLmdhcFN0b3JhZ2UgPSBudWxsO1xyXG5cdHRoaXMuY2hpbGRGZ3MgPSBbXTtcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbih2aXJ0dWFsKXtcclxuXHRpZiAoIXZpcnR1YWwpe1xyXG5cdFx0dmFyIGRvbSA9IHRoaXMuZ2V0RG9tKCk7XHJcblx0XHRkb20uZm9yRWFjaChmdW5jdGlvbihlbG0pe1xyXG5cdFx0XHRlbG0ucmVtb3ZlKCk7XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cdHRoaXMuY2xlYXIoKTtcclxuXHR2YXIgaW5zdGFuY2VJZCA9IHRoaXMuZmdDbGFzcy5pbnN0YW5jZXMuaW5kZXhPZih0aGlzKTtcdFxyXG5cdHRoaXMuZmdDbGFzcy5pbnN0YW5jZXMuc3BsaWNlKGluc3RhbmNlSWQsIDEpO1xyXG5cdGZnSW5zdGFuY2VUYWJsZVt0aGlzLmlkXSA9IG51bGw7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUucmVyZW5kZXIgPSBmdW5jdGlvbihkYXRhKXtcclxuXHR0aGlzLmNsZWFyKCk7XHJcblx0dGhpcy5nYXBTdG9yYWdlID0gbmV3IEdhcFN0b3JhZ2UodGhpcyk7XHJcblx0dmFyIGRvbSA9IHRoaXMuZ2V0RG9tKClbMF07XHJcblx0dGhpcy5jb2RlID0gdGhpcy5nZXRIdG1sKGRhdGEpO1xyXG5cdGRvbS5vdXRlckhUTUwgPSB0aGlzLmNvZGU7IC8vIGRvZXNudCB3b3JrIHdpdGggbXVsdGkgcm9vdFxyXG5cdHRoaXMuYXNzaWduKCk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuZ2V0RG9tID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gdGhpcy5tZXRhLmdldERvbSgpO1xyXG59O1xyXG5cclxuRmdJbnN0YW5jZUJhc2UucHJvdG90eXBlLmpxID0gZnVuY3Rpb24oKXtcclxuXHR2YXIgZG9tID0gdGhpcy5nZXREb20oKTtcclxuXHR2YXIgcmVzID0gaGVscGVyLmpxKGRvbSk7XHJcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApe1xyXG5cdFx0cmV0dXJuIHJlcztcclxuXHR9O1xyXG5cdHZhciBzZWxlY3RvciA9IGFyZ3VtZW50c1swXTtcclxuXHR2YXIgc2VsZlNlbGVjdGVkID0gcmVzXHJcblx0XHQucGFyZW50KClcclxuXHRcdC5maW5kKHNlbGVjdG9yKVxyXG5cdFx0LmZpbHRlcihmdW5jdGlvbihpZCwgZWxtKXtcclxuXHRcdFx0cmV0dXJuIGRvbS5pbmRleE9mKGVsbSkgPj0gMDtcclxuXHRcdH0pO1xyXG5cdHZhciBjaGlsZFNlbGVjdGVkID0gcmVzLmZpbmQoc2VsZWN0b3IpO1xyXG5cdHJldHVybiBzZWxmU2VsZWN0ZWQuYWRkKGNoaWxkU2VsZWN0ZWQpO1xyXG59O1xyXG5cclxuRmdJbnN0YW5jZUJhc2UucHJvdG90eXBlLmdhcCA9IGZ1bmN0aW9uKGlkKXtcclxuXHRyZXR1cm4gdGhpcy5nYXBzKGlkKVswXTtcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5nYXBzID0gZnVuY3Rpb24oaWQpe1xyXG5cdHZhciBnYXBzID0gdGhpcy5nYXBTdG9yYWdlLmJ5RWlkKGlkKTtcclxuXHRpZiAoZ2Fwcyl7XHJcblx0XHRyZXR1cm4gZ2FwcztcclxuXHR9O1x0XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuZWxtID0gRmdJbnN0YW5jZUJhc2UucHJvdG90eXBlLmdhcDsgLy8gbGVnYWN5XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuZWxtcyA9IEZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5nYXBzOyAvLyBsZWdhY3lcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbihpZCl7XHJcblx0dmFyIGdhcCA9IHRoaXMuZ2FwKGlkKTtcclxuXHRpZiAoIWdhcCl7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9O1xyXG5cdHJldHVybiBnYXAuZmcgfHwgbnVsbDsgXHJcbn07XHJcblxyXG5cclxuZnVuY3Rpb24gZ2V0RmdCeUlpZChpaWQpe1xyXG5cdHJldHVybiBmZ0luc3RhbmNlVGFibGVbaWlkXTtcclxufTtcclxuXHJcbmV4cG9ydHMuZ2V0RmdCeUlpZCA9IGdldEZnQnlJaWQ7XHJcbmV4cG9ydHMuRmdJbnN0YW5jZSA9IEZnSW5zdGFuY2U7XHJcbmV4cG9ydHMuRmdJbnN0YW5jZUJhc2UgPSBGZ0luc3RhbmNlQmFzZTtcclxuZXhwb3J0cy5mZ0luc3RhbmNlVGFibGUgPSBmZ0luc3RhbmNlVGFibGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgZ2FwQ2xhc3NlcyA9IHt9O1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCdmZy1qcy91dGlscycpO1xyXG52YXIgdmFsdWVNZ3IgPSByZXF1aXJlKCdmZy1qcy92YWx1ZU1ncicpO1xyXG5cclxuZnVuY3Rpb24gcmVnR2FwKGdhcEhhbmRsZXIpe1x0XHJcblx0Z2FwQ2xhc3Nlc1tnYXBIYW5kbGVyLm5hbWVdID0gZ2FwSGFuZGxlcjtcclxuXHRyZXR1cm4gZ2FwSGFuZGxlcjtcclxufTtcclxuZXhwb3J0cy5yZWdHYXAgPSByZWdHYXA7XHJcblxyXG5mdW5jdGlvbiBHYXAoY29udGV4dCwgcGFyc2VkTWV0YSwgcGFyZW50KXtcdFxyXG5cdHV0aWxzLmV4dGVuZCh0aGlzLCBwYXJzZWRNZXRhKTsgLy8gdG9kbzogd2h5P1xyXG5cdHRoaXMuY2hpbGRyZW4gPSBbXTtcdFxyXG5cdHRoaXMucGFyZW50ID0gcGFyZW50IHx8IG51bGw7XHJcblx0dGhpcy5yb290ID0gdGhpcztcclxuXHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1x0XHJcblx0Ly90aGlzLnNjb3BlUGF0aCA9IHV0aWxzLmdldFNjb3BlUGF0aCh0aGlzKTtcclxuXHQvL3RoaXMudHJpZ2dlcnMgPSBbXTtcclxuXHRjb250ZXh0LmdhcFN0b3JhZ2UucmVnKHRoaXMpO1xyXG5cdGlmICh0aGlzLnBhdGgpe1xyXG5cdFx0dGhpcy5yZXNvbHZlZFBhdGggPSB2YWx1ZU1nci5yZXNvbHZlUGF0aCh0aGlzLCB0aGlzLnBhdGgpOyBcclxuXHRcdGlmICh0aGlzLnJlc29sdmVkUGF0aC5zb3VyY2UgPT09IFwiZGF0YVwiKXtcclxuXHRcdFx0Y29udGV4dC5nYXBTdG9yYWdlLnNldFRyaWdnZXJzKHRoaXMsIFt0aGlzLnJlc29sdmVkUGF0aC5wYXRoXSk7XHJcblx0XHR9O1x0XHJcblx0fTtcclxuXHRpZiAoIXBhcmVudCl7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9O1xyXG5cdHRoaXMucm9vdCA9IHBhcmVudC5yb290O1xyXG5cdHBhcmVudC5jaGlsZHJlbi5wdXNoKHRoaXMpO1xyXG59O1xyXG5cclxuR2FwLnByb3RvdHlwZS5jbG9zZXN0ID0gZnVuY3Rpb24oc2VsZWN0b3Ipe1xyXG5cdHZhciBlaWQgPSBzZWxlY3Rvci5zbGljZSgxKTtcclxuXHR2YXIgZ2FwID0gdGhpcy5wYXJlbnQ7XHJcblx0d2hpbGUgKGdhcCl7XHJcblx0XHRpZiAoZ2FwLmVpZCA9PT0gZWlkKXtcclxuXHRcdFx0cmV0dXJuIGdhcDtcclxuXHRcdH07XHJcblx0XHRnYXAgPSBnYXAucGFyZW50O1xyXG5cdH07XHJcblx0cmV0dXJuIG51bGw7XHJcbn07XHJcblxyXG5HYXAucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbih2YWwpe1xyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKXtcclxuXHRcdHJldHVybiB1dGlscy5vYmpQYXRoKHRoaXMuc2NvcGVQYXRoLCB0aGlzLmNvbnRleHQuZGF0YSk7XHJcblx0fTtcclxuXHR0aGlzLmNvbnRleHQudXBkYXRlKHRoaXMuc2NvcGVQYXRoLCB2YWwpO1x0XHJcbn07XHJcblxyXG5HYXAucHJvdG90eXBlLmZpbmRSZWFsRG93biA9IGZ1bmN0aW9uKCl7XHJcblx0aWYgKCF0aGlzLmlzVmlydHVhbCl7XHJcblx0XHRyZXR1cm4gW3RoaXNdO1xyXG5cdH07XHJcblx0dmFyIHJlcyA9IFtdO1xyXG5cdHRoaXMuY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uKGNoaWxkKXtcclxuXHRcdHJlcyA9IHJlcy5jb25jYXQoY2hpbGQuZmluZFJlYWxEb3duKCkpO1xyXG5cdH0pO1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG5HYXAucHJvdG90eXBlLmdldERvbSA9IGZ1bmN0aW9uKCl7XHJcblx0aWYgKCF0aGlzLmlzVmlydHVhbCl7XHJcblx0XHR2YXIgaWQgPSBbXCJmZ1wiLCB0aGlzLmNvbnRleHQuaWQsIFwiZ2lkXCIsIHRoaXMuZ2lkXS5qb2luKCctJyk7XHJcblx0XHRyZXR1cm4gW2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKV07XHJcblx0fTtcclxuXHR2YXIgcmVzID0gW107XHJcblx0dGhpcy5maW5kUmVhbERvd24oKS5mb3JFYWNoKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRyZXMgPSByZXMuY29uY2F0KGdhcC5nZXREb20oKSk7XHJcblx0fSk7XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbkdhcC5wcm90b3R5cGUucmVtb3ZlRG9tID0gZnVuY3Rpb24oKXtcclxuXHR2YXIgZG9tID0gdGhpcy5nZXREb20oKTtcclxuXHRkb20uZm9yRWFjaChmdW5jdGlvbihlbG0pe1xyXG5cdFx0aWYgKCFlbG0pe1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9O1xyXG5cdFx0ZWxtLnJlbW92ZSgpO1xyXG5cdH0pO1xyXG59O1xyXG5cclxuZXhwb3J0cy5HYXAgPSBHYXA7XHJcblxyXG5mdW5jdGlvbiByZW5kZXIoY29udGV4dCwgcGFyZW50LCBkYXRhLCBtZXRhKXtcclxuXHR2YXIgZ2FwID0gbmV3IEdhcChjb250ZXh0LCBtZXRhLCBwYXJlbnQpO1xyXG5cdHZhciBnYXBDbGFzcyA9IGdhcENsYXNzZXNbbWV0YS50eXBlXTtcclxuXHRyZXR1cm4gZ2FwQ2xhc3MucmVuZGVyLmNhbGwoZ2FwLCBjb250ZXh0LCBkYXRhKTtcclxufTtcclxuXHJcbmV4cG9ydHMucmVuZGVyID0gcmVuZGVyO1xyXG5cclxuZnVuY3Rpb24gdXBkYXRlKGNvbnRleHQsIGdhcE1ldGEsIHNjb3BlUGF0aCwgdmFsdWUsIG9sZFZhbHVlKXtcclxuXHR2YXIgZ2FwQ2xhc3MgPSBnYXBDbGFzc2VzW2dhcE1ldGEudHlwZV07XHJcblx0aWYgKCFnYXBDbGFzcyl7XHJcblx0XHRyZXR1cm47XHJcblx0fTtcclxuXHRyZXR1cm4gZ2FwQ2xhc3MudXBkYXRlKGNvbnRleHQsIGdhcE1ldGEsIHNjb3BlUGF0aCwgdmFsdWUsIG9sZFZhbHVlKTtcclxufTtcclxuXHJcbmV4cG9ydHMudXBkYXRlID0gdXBkYXRlOyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMuanMnKTtcclxudmFyIFRyZWVIZWxwZXIgPSByZXF1aXJlKCdmZy1qcy91dGlscy90cmVlSGVscGVyLmpzJyk7XHJcblxyXG5mdW5jdGlvbiBpbml0Tm9kZUZuKCl7XHJcblx0cmV0dXJuIHtcclxuXHRcdGdhcHM6IFtdXHJcblx0fTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIEdhcFN0b3JhZ2UoY29udGV4dCl7XHJcblx0dGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuXHR0aGlzLmdhcHMgPSBbXTtcclxuXHR0aGlzLnNjb3BlVHJlZSA9IG5ldyBUcmVlSGVscGVyKHtcclxuXHRcdGtpbmQ6ICdkaWN0JyxcclxuXHRcdGluaXROb2RlOiBpbml0Tm9kZUZuXHJcblx0fSk7XHJcblx0dGhpcy5laWREaWN0ID0ge307XHRcclxufTtcclxuXHJcbkdhcFN0b3JhZ2UucHJvdG90eXBlLnNldFNjb3BlVHJpZ2dlciA9IGZ1bmN0aW9uKGdhcCwgc2NvcGVQYXRoKXtcclxuXHR2YXIgc2NvcGUgPSB0aGlzLnNjb3BlVHJlZS5hY2Nlc3Moc2NvcGVQYXRoKTtcdFxyXG5cdHNjb3BlLmRhdGEuZ2Fwcy5wdXNoKGdhcCk7XHJcbn07XHJcblxyXG4vKkdhcFN0b3JhZ2UucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG1ldGEsIHNjb3BlVHJpZ2dlcnMsIGdpZCl7XHJcblx0c2NvcGVUcmlnZ2VycyA9IHNjb3BlVHJpZ2dlcnMgfHwgW21ldGEuc2NvcGVQYXRoXTtcclxuXHR2YXIgZ2FwID0ge1xyXG5cdFx0XCJpZFwiOiBnaWQgfHwgdGhpcy5nZXRHaWQoKSxcclxuXHRcdFwibWV0YVwiOiBtZXRhXHJcblx0fTtcclxuXHRzY29wZVRyaWdnZXJzLmZvckVhY2godGhpcy5zZXRTY29wZVRyaWdnZXIuYmluZCh0aGlzLCBnYXApKTtcclxuXHR0aGlzLmdhcHMucHVzaChnYXApO1xyXG59O1xyXG5cclxuR2FwU3RvcmFnZS5wcm90b3R5cGUuc2V0QXR0cnMgPSBmdW5jdGlvbihtZXRhLCBhdHRycywgZ2lkKXtcclxuXHR2YXIgZmdHYXBDbGFzcyA9ICdmZy1nYXAtJyArIHRoaXMuY29udGV4dC5pZDtcclxuXHRhdHRycy5jbGFzcyA9IGF0dHJzLmNsYXNzIFxyXG5cdFx0PyBmZ0dhcENsYXNzICsgJyAnICsgYXR0cnMuY2xhc3NcclxuXHRcdDogZmdHYXBDbGFzcztcclxuXHRhdHRyc1tcImRhdGEtZmctXCIgKyB0aGlzLmNvbnRleHQuaWQgKyBcIi1nYXAtaWRcIl0gPSBnaWQ7XHJcblx0Ly9hdHRycy5pZCA9IFtcImZnXCIsIHRoaXMuY29udGV4dC5pZCwgXCJnYXAtaWRcIiwgZ2lkXS5qb2luKCctJyk7XHJcbiBcdHJldHVybiBhdHRycztcclxufTsqL1xyXG5cclxuR2FwU3RvcmFnZS5wcm90b3R5cGUuc2V0VHJpZ2dlcnMgPSBmdW5jdGlvbihnYXBNZXRhLCBzY29wZVRyaWdnZXJzKXtcdFxyXG5cdHNjb3BlVHJpZ2dlcnMuZm9yRWFjaCh0aGlzLnNldFNjb3BlVHJpZ2dlci5iaW5kKHRoaXMsIGdhcE1ldGEpKTtcclxufTtcclxuXHJcbkdhcFN0b3JhZ2UucHJvdG90eXBlLnJlZyA9IGZ1bmN0aW9uKGdhcE1ldGEpe1xyXG5cdHZhciBlaWQgPSBnYXBNZXRhLmVpZDtcclxuXHRpZiAoZWlkKXtcdFx0XHJcblx0XHR0aGlzLmVpZERpY3RbZWlkXSA9IHRoaXMuZWlkRGljdFtlaWRdIHx8IFtdO1xyXG5cdFx0dGhpcy5laWREaWN0W2VpZF0ucHVzaChnYXBNZXRhKTtcclxuXHR9O1xyXG5cdHZhciBnaWQgPSB0aGlzLmdldEdpZCgpO1xyXG5cdGdhcE1ldGEuZ2lkID0gZ2lkO1xyXG5cdGlmICghZ2FwTWV0YS5pc1ZpcnR1YWwpe1xyXG5cdFx0Z2FwTWV0YS5hdHRycyA9IHV0aWxzLnNpbXBsZUNsb25lKGdhcE1ldGEuYXR0cnMgfHwge30pO1x0XHRcclxuXHRcdGdhcE1ldGEuYXR0cnMuaWQgPSBbXCJmZ1wiLCB0aGlzLmNvbnRleHQuaWQsIFwiZ2lkXCIsIGdpZF0uam9pbignLScpO1xyXG5cdH07XHJcblx0Z2FwTWV0YS5zdG9yYWdlSWQgPSB0aGlzLmdhcHMubGVuZ3RoO1xyXG5cdHRoaXMuZ2Fwcy5wdXNoKGdhcE1ldGEpO1x0XHRcclxuXHQvL3JldHVybiBhdHRyc09iajtcclxufTtcclxuXHJcbkdhcFN0b3JhZ2UucHJvdG90eXBlLmFzc2lnbiA9IGZ1bmN0aW9uKCl7XHJcblx0Ly9pZiAoKVxyXG5cdHRoaXMuZ2Fwcy5mb3JFYWNoKGZ1bmN0aW9uKGdhcE1ldGEpe1xyXG5cdFx0aWYgKGdhcE1ldGEudHlwZSAhPT0gXCJyb290XCIgJiYgZ2FwTWV0YS5mZyl7XHJcblx0XHRcdGdhcE1ldGEuZmcuYXNzaWduKCk7XHJcblx0XHR9O1xyXG5cdH0pO1xyXG5cdHJldHVybjtcclxuXHQvLyB2YXIgc2VsZiA9IHRoaXM7XHJcblx0Ly8gdmFyIGdhcE5vZGVzID0gdGhpcy5jb250ZXh0LmRvbS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdmZy1nYXAtJyArIHRoaXMuY29udGV4dC5pZCk7XHJcblx0Ly8gZm9yICh2YXIgaSA9IDA7IGkgPCBnYXBOb2Rlcy5sZW5ndGg7IGkrKyl7XHJcblx0Ly8gXHR2YXIgZ2FwTm9kZSA9IGdhcE5vZGVzW2ldO1xyXG5cdC8vIFx0dmFyIGdpZCA9IGdhcE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWZnLScgKyB0aGlzLmNvbnRleHQuaWQgKyAnLWdhcC1pZCcpO1xyXG5cdC8vIFx0dmFyIGdhcCA9IHNlbGYuZ2Fwc1tnaWRdO1xyXG5cdC8vIFx0aWYgKCFnYXApe2NvbnRpbnVlfTtcclxuXHQvLyBcdGlmIChnYXAubWV0YS5mZyl7XHJcblx0Ly8gXHRcdGdhcC5tZXRhLmZnLmFzc2lnbigpO1xyXG5cdC8vIFx0fTtcclxuXHQvLyBcdGdhcC5tZXRhLmRvbSA9IGdhcE5vZGU7XHJcblx0Ly8gfTtcclxufTtcclxuXHJcbi8qR2FwU3RvcmFnZS5wcm90b3R5cGUuc3ViVHJlZSA9IGZ1bmN0aW9uKHNjb3BlUGF0aCl7XHJcblx0dmFyIGJyYW5jaCA9IGFjY2Vzc1Njb3BlTGVhZih0aGlzLnNjb3BlVHJlZSwgc2NvcGVQYXRoKTtcclxuXHR2YXIgcmVzID0gW107XHJcblxyXG5cdGZ1bmN0aW9uIGl0ZXJhdGUobm9kZSl7XHJcblx0XHRmb3IgKHZhciBpIGluIG5vZGUuY2hpbGRyZW4pe1xyXG5cclxuXHRcdH07XHJcblx0fTtcclxuXHJcblxyXG59OyovXHJcblxyXG5HYXBTdG9yYWdlLnByb3RvdHlwZS5ieVNjb3BlID0gZnVuY3Rpb24oc2NvcGVQYXRoLCB0YXJnZXRPbmx5KXtcclxuXHR2YXIgc2NvcGUgPSB0aGlzLnNjb3BlVHJlZS5hY2Nlc3Moc2NvcGVQYXRoKTtcdFx0XHJcblx0dmFyIHN1Yk5vZGVzID0gW107XHJcblx0aWYgKHNjb3BlLmNoaWxkQ291bnQgIT09IDAgJiYgIXRhcmdldE9ubHkpe1xyXG5cdFx0c3ViTm9kZXMgPSBzY29wZS5nZXREZWVwQ2hpbGRBcnIoKS5tYXAoZnVuY3Rpb24obm9kZSl7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0Z2Fwczogbm9kZS5kYXRhLmdhcHMsXHJcblx0XHRcdFx0cGF0aDogbm9kZS5wYXRoXHRcclxuXHRcdFx0fTtcdFx0XHRcclxuXHRcdH0pO1xyXG5cdH07XHJcblx0dmFyIHBhcmVudHMgPSBzY29wZS5nZXRQYXJlbnRzKCk7XHJcblx0cmV0dXJuIHtcclxuXHRcdHRhcmdldDogc2NvcGUuZGF0YS5nYXBzLFxyXG5cdFx0c3Viczogc3ViTm9kZXMsXHJcblx0XHRwYXJlbnRzOiBwYXJlbnRzXHJcblx0fTtcclxufTtcclxuXHJcbkdhcFN0b3JhZ2UucHJvdG90eXBlLnJlbW92ZVNjb3BlID0gZnVuY3Rpb24oc2NvcGVQYXRoKXtcclxuXHR2YXIgc2NvcGUgPSB0aGlzLmJ5U2NvcGUoc2NvcGVQYXRoKTtcdFxyXG5cdHZhciByZW1vdmVkRG9tR2FwcyA9IHNjb3BlLnRhcmdldDtcclxuXHR2YXIgcmVtb3ZlZEdhcHMgPSBzY29wZS50YXJnZXQ7XHJcblx0c2NvcGUuc3Vicy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpe1xyXG5cdFx0cmVtb3ZlZEdhcHMgPSByZW1vdmVkR2Fwcy5jb25jYXQobm9kZS5nYXBzKTtcclxuXHR9KTtcclxuXHR0aGlzLnNjb3BlVHJlZS5yZW1vdmUoc2NvcGVQYXRoKTtcclxuXHR0aGlzLmdhcHMgPSB0aGlzLmdhcHMuZmlsdGVyKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRyZXR1cm4gcmVtb3ZlZEdhcHMuaW5kZXhPZihnYXApIDwgMDtcclxuXHR9KTtcclxuXHRyZW1vdmVkRG9tR2Fwcy5mb3JFYWNoKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRnYXAucmVtb3ZlRG9tKCk7XHJcblx0fSk7XHJcbn07XHJcblxyXG5HYXBTdG9yYWdlLnByb3RvdHlwZS5ieUVpZCA9IGZ1bmN0aW9uKGVpZCl7XHJcblx0cmV0dXJuIHRoaXMuZWlkRGljdFtlaWRdO1xyXG59O1xyXG5cclxuR2FwU3RvcmFnZS5wcm90b3R5cGUuZ2V0R2lkID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gdGhpcy5nYXBzLmxlbmd0aDtcclxufTtcclxuXHJcbmV4cG9ydHMuR2FwU3RvcmFnZSA9IEdhcFN0b3JhZ2U7XHJcbiIsInZhciBnYXBDbGFzc01nciA9IHJlcXVpcmUoJ2ZnLWpzL2NsaWVudC9nYXBDbGFzc01nci5qcycpO1xuZ2FwQ2xhc3NNZ3IucmVnR2FwKHtcblx0XCJuYW1lXCI6IFwiY29udGVudFwiLFxuXHRcInBhdGhcIjogXCIuLi9nYXBzL2NvbnRlbnRcIixcblx0XCJyZW5kZXJcIjogcmVxdWlyZShcIi4uL2dhcHMvY29udGVudC9yZW5kZXIuanNcIiksXG5cdFwidXBkYXRlXCI6IHJlcXVpcmUoXCIuLi9nYXBzL2NvbnRlbnQvdXBkYXRlLmpzXCIpLFxufSk7XG5nYXBDbGFzc01nci5yZWdHYXAoe1xuXHRcIm5hbWVcIjogXCJkYXRhXCIsXG5cdFwicGF0aFwiOiBcIi4uL2dhcHMvZGF0YVwiLFxuXHRcInJlbmRlclwiOiByZXF1aXJlKFwiLi4vZ2Fwcy9kYXRhL3JlbmRlci5qc1wiKSxcblx0XCJ1cGRhdGVcIjogcmVxdWlyZShcIi4uL2dhcHMvZGF0YS91cGRhdGUuanNcIiksXG59KTtcbmdhcENsYXNzTWdyLnJlZ0dhcCh7XG5cdFwibmFtZVwiOiBcImR5bmFtaWMtdGV4dFwiLFxuXHRcInBhdGhcIjogXCIuLi9nYXBzL2R5bmFtaWMtdGV4dFwiLFxuXHRcInJlbmRlclwiOiByZXF1aXJlKFwiLi4vZ2Fwcy9keW5hbWljLXRleHQvcmVuZGVyLmpzXCIpLFxuXHRcInVwZGF0ZVwiOiByZXF1aXJlKFwiLi4vZ2Fwcy9keW5hbWljLXRleHQvdXBkYXRlLmpzXCIpLFxufSk7XG5nYXBDbGFzc01nci5yZWdHYXAoe1xuXHRcIm5hbWVcIjogXCJmZ1wiLFxuXHRcInBhdGhcIjogXCIuLi9nYXBzL2ZnXCIsXG5cdFwicmVuZGVyXCI6IHJlcXVpcmUoXCIuLi9nYXBzL2ZnL3JlbmRlci5qc1wiKSxcblx0XCJ1cGRhdGVcIjogcmVxdWlyZShcIi4uL2dhcHMvZmcvdXBkYXRlLmpzXCIpLFxufSk7XG5nYXBDbGFzc01nci5yZWdHYXAoe1xuXHRcIm5hbWVcIjogXCJyYXdcIixcblx0XCJwYXRoXCI6IFwiLi4vZ2Fwcy9yYXdcIixcblx0XCJyZW5kZXJcIjogcmVxdWlyZShcIi4uL2dhcHMvcmF3L3JlbmRlci5qc1wiKSxcblx0XCJ1cGRhdGVcIjogcmVxdWlyZShcIi4uL2dhcHMvcmF3L3VwZGF0ZS5qc1wiKSxcbn0pO1xuZ2FwQ2xhc3NNZ3IucmVnR2FwKHtcblx0XCJuYW1lXCI6IFwic2NvcGVcIixcblx0XCJwYXRoXCI6IFwiLi4vZ2Fwcy9zY29wZVwiLFxuXHRcInJlbmRlclwiOiByZXF1aXJlKFwiLi4vZ2Fwcy9zY29wZS9yZW5kZXIuanNcIiksXG5cdFwidXBkYXRlXCI6IHJlcXVpcmUoXCIuLi9nYXBzL3Njb3BlL3VwZGF0ZS5qc1wiKSxcbn0pO1xuZ2FwQ2xhc3NNZ3IucmVnR2FwKHtcblx0XCJuYW1lXCI6IFwic2NvcGUtaXRlbVwiLFxuXHRcInBhdGhcIjogXCIuLi9nYXBzL3Njb3BlLWl0ZW1cIixcblx0XCJyZW5kZXJcIjogcmVxdWlyZShcIi4uL2dhcHMvc2NvcGUtaXRlbS9yZW5kZXIuanNcIiksXG5cdFwidXBkYXRlXCI6IHJlcXVpcmUoXCIuLi9nYXBzL3Njb3BlLWl0ZW0vdXBkYXRlLmpzXCIpLFxufSk7IiwidmFyIGV2ZW50cyA9IHt9O1xyXG5cclxuZnVuY3Rpb24gaGFuZGxlcihuYW1lLCBldmVudCl7XHJcblx0dmFyIGVsbSA9IGV2ZW50LnRhcmdldDtcclxuXHR3aGlsZSAoZWxtKXtcclxuXHRcdHZhciBmZyA9ICRmZy5ieURvbShlbG0pO1xyXG5cdFx0aWYgKGZnKXtcclxuXHRcdFx0ZmcuZW1pdEFwcGx5KG5hbWUsIGZnLCBbZXZlbnRdKTtcclxuXHRcdFx0Ly9yZXR1cm47XHJcblx0XHR9O1xyXG5cdFx0ZWxtID0gZWxtLnBhcmVudE5vZGU7XHJcblx0fTtcclxufTtcclxuXHJcbmV4cG9ydHMubGlzdGVuID0gZnVuY3Rpb24obmFtZSl7XHJcblx0aWYgKG5hbWUgaW4gZXZlbnRzKXtcclxuXHRcdHJldHVybjtcclxuXHR9O1x0XHJcblx0ZXZlbnRzW25hbWVdID0gdHJ1ZTtcclxuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGhhbmRsZXIuYmluZChudWxsLCBuYW1lKSwge1wiY2FwdHVyZVwiOiB0cnVlfSk7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSAkZmc7XHJcblxyXG52YXIgZmdDbGFzc01vZHVsZSA9IHJlcXVpcmUoJ2ZnLWpzL2NsaWVudC9mZ0NsYXNzLmpzJyk7XHJcbnZhciBmZ0luc3RhbmNlTW9kdWxlID0gcmVxdWlyZSgnZmctanMvY2xpZW50L2ZnSW5zdGFuY2UuanMnKTtcclxuXHJcbmZ1bmN0aW9uICRmZyhhcmcpe1xyXG5cdGlmIChhcmcgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCl7XHJcblx0XHRyZXR1cm4gJGZnLmJ5RG9tKGFyZyk7XHJcblx0fTtcclxuXHRpZiAodHlwZW9mIGFyZyA9PSBcInN0cmluZ1wiKXtcclxuXHRcdHJldHVybiBmZ0NsYXNzTW9kdWxlLmZnQ2xhc3NEaWN0W2FyZ107XHJcblx0fTtcclxufTtcclxuXHJcbiRmZy5sb2FkID0gZnVuY3Rpb24oZmdEYXRhKXtcclxuXHRpZiAoQXJyYXkuaXNBcnJheShmZ0RhdGEpKXtcdFx0XHJcblx0XHRyZXR1cm4gZmdEYXRhLm1hcCgkZmcubG9hZCk7XHJcblx0fTtcclxuXHRyZXR1cm4gbmV3IGZnQ2xhc3NNb2R1bGUuRmdDbGFzcyhmZ0RhdGEpO1xyXG59O1xyXG5cclxuJGZnLmlzRmcgPSBmdW5jdGlvbihkb21Ob2RlKXtcclxuXHRyZXR1cm4gZG9tTm9kZS5jbGFzc0xpc3QgJiYgZG9tTm9kZS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZnJyk7XHJcbn07XHJcblxyXG52YXIgaWlkUmUgPSAvZmdcXC1paWRcXC0oXFxkKykvZztcclxudmFyIGlkUmUgPSAvZmdcXC0oXFxkKylcXC1naWRcXC0oXFxkKykvZztcclxuXHJcbiRmZy5ieURvbSA9IGZ1bmN0aW9uKGRvbU5vZGUpe1x0XHJcblx0aWYgKCFkb21Ob2RlIHx8ICFkb21Ob2RlLmNsYXNzTmFtZSl7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9O1xyXG5cdGlmICghfmRvbU5vZGUuY2xhc3NOYW1lLnNwbGl0KCcgJykuaW5kZXhPZignZmcnKSl7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9O1xyXG5cdGlmICghZG9tTm9kZS5pZCl7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9O1xyXG5cdGlkUmUubGFzdEluZGV4ID0gMDtcclxuXHR2YXIgcmVzID0gaWRSZS5leGVjKGRvbU5vZGUuaWQpO1xyXG5cdGlmICghcmVzKXtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH07XHJcblx0dmFyIGlpZCA9IHBhcnNlSW50KHJlc1sxXSk7XHJcblx0cmV0dXJuIGZnSW5zdGFuY2VNb2R1bGUuZ2V0RmdCeUlpZChpaWQpO1x0XHJcbn07XHJcblxyXG4kZmcuZ2FwQ2xvc2VzdCA9IGZ1bmN0aW9uKGRvbU5vZGUpe1xyXG5cdHdoaWxlICh0cnVlKXtcclxuXHRcdGlkUmUubGFzdEluZGV4ID0gMDtcclxuXHRcdHZhciByZXMgPSBpZFJlLmV4ZWMoZG9tTm9kZS5pZCk7XHJcblx0XHRpZiAoIXJlcyl7XHJcblx0XHRcdGRvbU5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGU7XHJcblx0XHRcdGlmICghZG9tTm9kZSl7XHJcblx0XHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHRcdH07XHJcblx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0fTtcclxuXHRcdHZhciBpaWQgPSBwYXJzZUludChyZXNbMV0pO1xyXG5cdFx0dmFyIGZnID0gZmdJbnN0YW5jZU1vZHVsZS5nZXRGZ0J5SWlkKGlpZCk7XHJcblx0XHR2YXIgZ2lkID0gcGFyc2VJbnQocmVzWzJdKTtcclxuXHRcdHJldHVybiBmZy5nYXBTdG9yYWdlLmdhcHNbZ2lkXTtcclxuXHR9O1xyXG59O1xyXG5cclxuJGZnLmNsYXNzZXMgPSBmZ0NsYXNzTW9kdWxlLmZnQ2xhc3NEaWN0O1xyXG5cclxuJGZnLmZncyA9IGZnSW5zdGFuY2VNb2R1bGUuZmdJbnN0YW5jZVRhYmxlO1xyXG5cclxuJGZnLmpxID0gd2luZG93LmpRdWVyeTtcclxuXHJcbndpbmRvdy4kZmcgPSAkZmc7IiwicmVxdWlyZSgnLi9nYXBzLmpzJyk7XHJcbnZhciBmZ0hlbHBlciA9IHJlcXVpcmUoJy4vaGVscGVyLmpzJyk7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIocGFyZW50KXtcclxuXHR0aGlzLmV2ZW50cyA9IHt9O1xyXG5cdHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG59O1xyXG5cclxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKG5hbWUsIGZuKXtcclxuXHR2YXIgZXZlbnRMaXN0ID0gdGhpcy5ldmVudHNbbmFtZV07XHJcblx0aWYgKCFldmVudExpc3Qpe1xyXG5cdFx0ZXZlbnRMaXN0ID0gW107XHJcblx0XHR0aGlzLmV2ZW50c1tuYW1lXSA9IGV2ZW50TGlzdDtcclxuXHR9O1xyXG5cdGV2ZW50TGlzdC5wdXNoKGZuKTtcclxufTtcclxuXHJcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKG5hbWUvKiwgcmVzdCovKXtcclxuXHRpZiAodGhpcy5wYXJlbnQpe1xyXG5cdFx0dGhpcy5wYXJlbnQuZW1pdC5hcHBseSh0aGlzLnBhcmVudCwgYXJndW1lbnRzKTtcclxuXHR9O1xyXG5cdHZhciBldmVudExpc3QgPSB0aGlzLmV2ZW50c1tuYW1lXTtcclxuXHRpZiAoIWV2ZW50TGlzdCl7XHJcblx0XHRyZXR1cm47XHJcblx0fTtcclxuXHR2YXIgZW1pdEFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHQgXHJcblx0ZXZlbnRMaXN0LmZvckVhY2goZnVuY3Rpb24oZm4pe1xyXG5cdFx0Zm4uYXBwbHkodGhpcywgZW1pdEFyZ3MpO1xyXG5cdH0pO1xyXG59O1xyXG5cclxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0QXBwbHkgPSBmdW5jdGlvbihuYW1lLCB0aGlzQXJnLCBhcmdzKXtcclxuXHRpZiAodGhpcy5wYXJlbnQpe1xyXG5cdFx0dGhpcy5wYXJlbnQuZW1pdEFwcGx5LmFwcGx5KHRoaXMucGFyZW50LCBhcmd1bWVudHMpO1xyXG5cdH07XHJcblx0dmFyIGV2ZW50TGlzdCA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG5cdGlmICghZXZlbnRMaXN0KXtcclxuXHRcdHJldHVybjtcclxuXHR9O1xyXG5cdGV2ZW50TGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGZuKXtcclxuXHRcdGZuLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xyXG5cdH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7IiwiZnVuY3Rpb24gcmVuZGVyKGNvbnRleHQsIGRhdGEpe1xyXG5cdHRoaXMuc2NvcGVQYXRoID0gY29udGV4dC5nYXBNZXRhLnNjb3BlUGF0aDtcclxuXHRyZXR1cm4gY29udGV4dC5wYXJlbnQucmVuZGVyVHBsKGNvbnRleHQubWV0YS5jb250ZW50LCBjb250ZXh0LmdhcE1ldGEucGFyZW50LCBjb250ZXh0LnBhcmVudC5kYXRhKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcmVuZGVyOyIsImZ1bmN0aW9uIHVwZGF0ZShjb250ZXh0LCBtZXRhLCBzY29wZVBhdGgsIHZhbHVlKXtcclxuXHRyZXR1cm47XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHVwZGF0ZTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB2YWx1ZU1nciA9IHJlcXVpcmUoJ2ZnLWpzL3ZhbHVlTWdyJyk7XHJcbnZhciB1dGlscyA9IHJlcXVpcmUoJ2ZnLWpzL3V0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiByZW5kZXIoY29udGV4dCwgZGF0YSl7XHJcblx0dmFyIHZhbHVlID0gdmFsdWVNZ3IucmVuZGVyKHRoaXMsIGRhdGEsIHRoaXMucmVzb2x2ZWRQYXRoKTtcclxuXHRyZXR1cm4gdXRpbHMucmVuZGVyVGFnKHtcclxuXHRcdG5hbWU6IFwic3BhblwiLFxyXG5cdFx0YXR0cnM6IHRoaXMuYXR0cnMsXHJcblx0XHRpbm5lckhUTUw6IHZhbHVlXHJcblx0fSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlbmRlcjsiLCJmdW5jdGlvbiB1cGRhdGUoY29udGV4dCwgbWV0YSwgc2NvcGVQYXRoLCB2YWx1ZSl7XHJcblx0dmFyIG5vZGUgPSBtZXRhLmdldERvbSgpWzBdO1xyXG5cdGlmICghbm9kZSl7XHJcblx0XHRcclxuXHR9O1xyXG5cdG5vZGUuaW5uZXJIVE1MID0gdmFsdWU7XHJcblx0Ly9oaWdobGlnaHQobm9kZSwgWzB4ZmZmZmZmLCAweGZmZWU4OF0sIDUwMCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHVwZGF0ZTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBTdHJUcGwgPSByZXF1aXJlKCdmZy1qcy9zdHJUcGwuanMnKTtcclxudmFyIGdhcENsYXNzTWdyID0gcmVxdWlyZSgnZmctanMvY2xpZW50L2dhcENsYXNzTWdyLmpzJyk7XHJcblxyXG5mdW5jdGlvbiByZW5kZXIoY29udGV4dCwgZGF0YSl7XHJcblx0dmFyIG1ldGEgPSB0aGlzO1xyXG5cdHZhciB0cGwgPSBuZXcgU3RyVHBsKG1ldGEudHBsKTtcclxuXHRyZXR1cm4gdHBsLnJlbmRlcihmdW5jdGlvbihwYXRoKXtcclxuXHRcdHZhciBkYXRhTWV0YSA9IHtcclxuXHRcdFx0XCJ0eXBlXCI6IFwiZGF0YVwiLFxyXG5cdFx0XHRcInBhdGhcIjogcGF0aFx0XHRcdFxyXG5cdFx0fTtcclxuXHRcdHZhciBpdGVtTWV0YSA9IG5ldyBnYXBDbGFzc01nci5HYXAoY29udGV4dCwgZGF0YU1ldGEsIG1ldGEucGFyZW50KTtcclxuXHRcdHJldHVybiBnYXBDbGFzc01nci5yZW5kZXIoY29udGV4dCwgbWV0YS5wYXJlbnQsIGRhdGEsIGl0ZW1NZXRhKTtcclxuXHR9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcmVuZGVyOyIsInZhciB2YWx1ZU1nciA9IHJlcXVpcmUoJ2ZnLWpzL3ZhbHVlTWdyLmpzJyk7XHJcbnZhciB1dGlscyA9IHJlcXVpcmUoJ2ZnLWpzL3V0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiByZW5kZXIoY29udGV4dCwgZGF0YSl7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHRoaXMucGFyZW50RmcgPSBjb250ZXh0O1xyXG5cdC8vdGhpcy5yZW5kZXJlZENvbnRlbnQgPSBjb250ZXh0LnJlbmRlclRwbCh0aGlzLmNvbnRlbnQsIG1ldGEsIGRhdGEpO1xyXG5cdHZhciBmZ0NsYXNzID0gJGZnLmNsYXNzZXNbdGhpcy5mZ05hbWVdO1xyXG5cdHZhciBmZ0RhdGEgPSB1dGlscy5kZWVwQ2xvbmUodmFsdWVNZ3IuZ2V0VmFsdWUodGhpcywgZGF0YSwgdGhpcy5yZXNvbHZlZFBhdGgpKTtcdFxyXG5cdHZhciBmZyA9IGZnQ2xhc3MucmVuZGVyKGZnRGF0YSwgdGhpcywgY29udGV4dCk7XHJcblx0Zmcub24oJ3VwZGF0ZScsIGZ1bmN0aW9uKHBhdGgsIHZhbCl7XHJcblx0XHRjb250ZXh0LnVwZGF0ZShzY29wZVBhdGguY29uY2F0KHBhdGgpLCB2YWwpO1xyXG5cdFx0Ly9jb25zb2xlLmxvZyhwYXRoLCB2YWwpO1xyXG5cdH0pO1xyXG5cdHRoaXMuZmcgPSBmZztcclxuXHRmZy5tZXRhID0gdGhpcztcclxuXHRjb250ZXh0LmNoaWxkRmdzLnB1c2goZmcpO1xyXG5cdHJldHVybiBmZztcclxuXHRpZiAodHJ1ZSl7IC8vIGNsaWVudFxyXG5cdFx0XHJcblx0fTtcdFx0XHJcblx0dGhyb3cgJ3RvZG8gc2VydmVyIHJlbmRlcic7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlbmRlcjsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB1dGlscyA9IHJlcXVpcmUoJ2ZnLWpzL3V0aWxzJyk7XHJcbnZhciB2YWx1ZU1nciA9IHJlcXVpcmUoJ2ZnLWpzL3ZhbHVlTWdyJyk7XHJcbnZhciBTdHJUcGwgPSByZXF1aXJlKCdmZy1qcy9zdHJUcGwuanMnKTtcclxuXHJcbmZ1bmN0aW9uIHJlbmRlcihjb250ZXh0LCBkYXRhKXtcclxuXHR2YXIgbWV0YSA9IHRoaXM7XHJcblx0aWYgKG1ldGEuaXNTY29wZUhvbGRlcil7XHJcblx0XHRtZXRhLnJvb3QuY3VycmVudFNjb3BlSG9sZGVyID0gbWV0YTtcdFx0XHJcblx0fTtcclxuXHR2YXIgYXR0cnNBcnIgPSB1dGlscy5vYmpUb0tleVZhbHVlKG1ldGEuYXR0cnMsICduYW1lJywgJ3ZhbHVlJyk7XHJcblx0dmFyIGF0dHJPYmogPSB7fTtcclxuXHRhdHRyc0Fyci5mb3JFYWNoKGZ1bmN0aW9uKGF0dHIpe1xyXG5cdFx0dmFyIG5hbWUgPSBuZXcgU3RyVHBsKGF0dHIubmFtZSkucmVuZGVyKHZhbHVlTWdyLnJlc29sdmVBbmRSZW5kZXIuYmluZChudWxsLCBtZXRhLCBkYXRhKSk7XHJcblx0XHR2YXIgdmFsdWUgPSBuZXcgU3RyVHBsKGF0dHIudmFsdWUpLnJlbmRlcih2YWx1ZU1nci5yZXNvbHZlQW5kUmVuZGVyLmJpbmQobnVsbCwgbWV0YSwgZGF0YSkpO1xyXG5cdFx0YXR0ck9ialtuYW1lXSA9IHZhbHVlO1xyXG5cdH0pO1xyXG5cdHZhciB0cmlnZ2VycyA9IFtdO1xyXG5cdGNvbnRleHQuZ2FwU3RvcmFnZS5zZXRUcmlnZ2VycyhtZXRhLCB0cmlnZ2Vycyk7XHJcblx0Ly8gbm90IHVzaW5nIFtkYXRhXSByZW5kZXJpbmcgYWxsb3cgdG8gaGF2ZSBubyBleHRyYSA8c3Bhbj4gYXJvdW5kIGRhdGFcclxuXHQvLyB2YXIgaW5uZXI7XHRcclxuXHQvLyBpZiAobWV0YS52YWx1ZSl7XHJcblx0Ly8gXHR2YXIgZGF0YU1ldGEgPSB7XHJcblx0Ly8gXHRcdFwidHlwZVwiOiBcImRhdGFcIixcclxuXHQvLyBcdFx0XCJwYXRoXCI6IG1ldGEudmFsdWVcdFx0XHRcclxuXHQvLyBcdH07XHJcblx0Ly8gXHR2YXIgaXRlbU1ldGEgPSBuZXcgZ2FwQ2xhc3NNZ3IuR2FwKGNvbnRleHQsIGRhdGFNZXRhLCBtZXRhKTtcclxuXHQvLyBcdGlubmVyID0gZ2FwQ2xhc3NNZ3IucmVuZGVyKGNvbnRleHQsIG1ldGEsIGRhdGEsIGl0ZW1NZXRhKTtcclxuXHQvLyB9ZWxzZXtcclxuXHQvLyBcdGlubmVyID0gY29udGV4dC5yZW5kZXJUcGwobWV0YS5jb250ZW50LCBtZXRhLCBkYXRhKTtcdFx0XHRcdFxyXG5cdC8vIH07XHJcblx0dmFyIGlubmVyID0gbWV0YS5wYXRoIFxyXG5cdFx0PyB2YWx1ZU1nci5nZXRWYWx1ZShtZXRhLCBkYXRhLCB0aGlzLnJlc29sdmVkUGF0aClcclxuXHRcdDogY29udGV4dC5yZW5kZXJUcGwobWV0YS5jb250ZW50LCBtZXRhLCBkYXRhKTtcclxuXHRyZXR1cm4gdXRpbHMucmVuZGVyVGFnKHtcclxuXHRcdFwibmFtZVwiOiBtZXRhLnRhZ05hbWUsXHJcblx0XHRcImF0dHJzXCI6IGF0dHJPYmosXHJcblx0XHRcImlubmVySFRNTFwiOiBpbm5lclxyXG5cdH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXI7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5mdW5jdGlvbiB1cGRhdGUoY29udGV4dCwgbWV0YSwgc2NvcGVQYXRoLCB2YWx1ZSl7XHJcblx0Ly8gdG8gZG8gdmFsdWUgdXBkYXRlXHJcblx0dmFyIHZhbHVlTWdyID0gcmVxdWlyZSgnZmctanMvdmFsdWVNZ3InKTtcclxuXHR2YXIgdXRpbHMgPSByZXF1aXJlKCdmZy1qcy91dGlscycpO1xyXG5cdHZhciBTdHJUcGwgPSByZXF1aXJlKCdmZy1qcy9zdHJUcGwuanMnKTtcclxuXHJcblx0Lyp2YXIgYXR0ckRhdGEgPSB1dGlscy5vYmpQYXRoKG1ldGEuc2NvcGVQYXRoLCBjb250ZXh0LmRhdGEpO1xyXG5cdHZhciByZW5kZXJlZEF0dHJzID0gdXRpbHMucmVuZGVyQXR0cnMobWV0YS5hdHRycywgYXR0ckRhdGEpOyovXHJcblx0dmFyIGF0dHJzQXJyID0gdXRpbHMub2JqVG9LZXlWYWx1ZShtZXRhLmF0dHJzLCAnbmFtZScsICd2YWx1ZScpO1xyXG5cdHZhciBhdHRyT2JqID0ge307XHJcblx0YXR0cnNBcnIuZm9yRWFjaChmdW5jdGlvbihhdHRyKXtcclxuXHRcdHZhciBuYW1lID0gbmV3IFN0clRwbChhdHRyLm5hbWUpLnJlbmRlcih2YWx1ZU1nci5yZW5kZXIuYmluZChudWxsLCBtZXRhLCBjb250ZXh0LmRhdGEpKTtcclxuXHRcdHZhciB2YWx1ZSA9IG5ldyBTdHJUcGwoYXR0ci52YWx1ZSkucmVuZGVyKGZ1bmN0aW9uKHBhdGgpe1xyXG5cdFx0XHR2YXIgcmVzb2x2ZWRQYXRoID0gdmFsdWVNZ3IucmVzb2x2ZVBhdGgobWV0YSwgcGF0aCk7XHRcdFxyXG5cdFx0XHRyZXR1cm4gdmFsdWVNZ3IucmVuZGVyKG1ldGEsIGNvbnRleHQuZGF0YSwgcmVzb2x2ZWRQYXRoKTtcclxuXHRcdH0pO1xyXG5cdFx0YXR0ck9ialtuYW1lXSA9IHZhbHVlO1xyXG5cdH0pO1xyXG5cdHZhciBkb20gPSBtZXRhLmdldERvbSgpWzBdO1xyXG5cdGlmIChtZXRhLnBhdGggJiYgbWV0YS5wYXRoLnBhdGguam9pbignLScpID09PSBzY29wZVBhdGguam9pbignLScpKXtcclxuXHRcdGRvbS5pbm5lckhUTUwgPSBtZXRhLnBhdGguZXNjYXBlZCBcclxuXHRcdFx0PyB1dGlscy5lc2NhcGVIdG1sKHZhbHVlKVxyXG5cdFx0XHQ6IHZhbHVlO1xyXG5cdH07XHJcblx0dXRpbHMub2JqRm9yKGF0dHJPYmosIGZ1bmN0aW9uKHZhbHVlLCBuYW1lKXtcclxuXHRcdHZhciBvbGRWYWwgPSBkb20uZ2V0QXR0cmlidXRlKG5hbWUpO1xyXG5cdFx0aWYgKG9sZFZhbCAhPT0gdmFsdWUpe1xyXG5cdFx0XHRkb20uc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcclxuXHRcdH07XHJcblx0fSk7XHRcdFxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB1cGRhdGU7IiwidmFyIHV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMnKTtcdFx0XHJcbnZhciB2YWx1ZU1nciA9IHJlcXVpcmUoJ2ZnLWpzL3ZhbHVlTWdyLmpzJyk7XHJcblxyXG5mdW5jdGlvbiByZW5kZXIoY29udGV4dCwgZGF0YSl7XHJcblx0dmFyIG1ldGEgPSB0aGlzO1xyXG5cdHZhciBzY29wZURhdGEgPSB2YWx1ZU1nci5nZXRWYWx1ZShtZXRhLCBkYXRhLCB0aGlzLnJlc29sdmVkUGF0aCk7XHJcblx0dGhpcy5zY29wZVBhdGggPSB0aGlzLnJlc29sdmVkUGF0aC5wYXRoO1xyXG5cdGlmICghc2NvcGVEYXRhKXtcclxuXHRcdHJldHVybiAnJztcclxuXHR9O1xyXG5cdHJldHVybiBjb250ZXh0LnJlbmRlclRwbChtZXRhLmNvbnRlbnQsIG1ldGEsIGRhdGEpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXI7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgYW5jaG9yTWdyID0gcmVxdWlyZSgnZmctanMvYW5jaG9yTWdyLmpzJyk7XHJcbnZhciB2YWx1ZU1nciA9IHJlcXVpcmUoJ2ZnLWpzL3ZhbHVlTWdyLmpzJyk7XHJcbnZhciByZW5kZXJTY29wZUNvbnRlbnQgPSByZXF1aXJlKCcuL3JlbmRlclNjb3BlQ29udGVudC5qcycpO1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyKGNvbnRleHQsIGRhdGEpe1xyXG5cdHZhciBtZXRhID0gdGhpcztcclxuXHRtZXRhLml0ZW1zID0gW107XHJcblx0dmFyIHNjb3BlRGF0YSA9IHZhbHVlTWdyLmdldFZhbHVlKG1ldGEsIGRhdGEsIHRoaXMucmVzb2x2ZWRQYXRoKTtcclxuXHR0aGlzLnNjb3BlUGF0aCA9IHRoaXMucmVzb2x2ZWRQYXRoLnBhdGg7XHJcblx0dmFyIGFuY2hvckNvZGUgPSBhbmNob3JNZ3IuZ2VuQ29kZShjb250ZXh0LCBtZXRhKTtcdFx0XHJcblx0dmFyIHBhcnRzID0gcmVuZGVyU2NvcGVDb250ZW50KGNvbnRleHQsIG1ldGEsIHNjb3BlRGF0YSwgZGF0YSwgMCk7XHRcclxuXHRyZXR1cm4gcGFydHMuam9pbignXFxuJykgKyBhbmNob3JDb2RlO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXI7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgdmFsdWVNZ3IgPSByZXF1aXJlKCdmZy1qcy92YWx1ZU1nci5qcycpO1xyXG52YXIgZ2FwQ2xhc3NNZ3IgPSByZXF1aXJlKCdmZy1qcy9jbGllbnQvZ2FwQ2xhc3NNZ3IuanMnKTtcclxuXHJcbmZ1bmN0aW9uIHJlbmRlclNjb3BlQ29udGVudChjb250ZXh0LCBzY29wZU1ldGEsIHNjb3BlRGF0YSwgZGF0YSwgaWRPZmZzZXQpe1xyXG5cdHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheShzY29wZURhdGEpO1xyXG5cdGlmICghaXNBcnJheSl7XHJcblx0XHRzY29wZURhdGEgPSBbc2NvcGVEYXRhXTtcclxuXHR9O1xyXG5cdHZhciBwYXJ0cyA9IHNjb3BlRGF0YS5tYXAoZnVuY3Rpb24oZGF0YUl0ZW0sIGlkKXtcclxuXHRcdHZhciBpdGVtTWV0YSA9IHNjb3BlTWV0YTtcclxuXHRcdHZhciBwYXRoID0gaXNBcnJheVxyXG5cdFx0XHQ/IHZhbHVlTWdyLnJlYWQoWyhpZCArIGlkT2Zmc2V0KS50b1N0cmluZygpXSlcclxuXHRcdFx0OiB2YWx1ZU1nci5yZWFkKFtdKTtcclxuXHRcdHZhciBpdGVtQ2ZnID0ge1xyXG5cdFx0XHRcInR5cGVcIjogXCJzY29wZS1pdGVtXCIsXHJcblx0XHRcdFwiaXNWaXJ0dWFsXCI6IHRydWUsXHJcblx0XHRcdFwicGF0aFwiOiBwYXRoLFxyXG5cdFx0XHRcImNvbnRlbnRcIjogc2NvcGVNZXRhLmNvbnRlbnRcclxuXHRcdH07XHJcblx0XHRpZiAoc2NvcGVNZXRhLmVpZCl7XHJcblx0XHRcdGl0ZW1DZmcuZWlkID0gc2NvcGVNZXRhLmVpZCArICctaXRlbSc7XHJcblx0XHR9O1xyXG5cdFx0aXRlbU1ldGEgPSBuZXcgZ2FwQ2xhc3NNZ3IuR2FwKGNvbnRleHQsIGl0ZW1DZmcsIGl0ZW1NZXRhKTtcdFx0XHJcblx0XHRyZXR1cm4gZ2FwQ2xhc3NNZ3IucmVuZGVyKGNvbnRleHQsIHNjb3BlTWV0YSwgZGF0YSwgaXRlbU1ldGEpO1xyXG5cdH0pO1xyXG5cdHJldHVybiBwYXJ0cztcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcmVuZGVyU2NvcGVDb250ZW50OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHJlbmRlclNjb3BlQ29udGVudCA9IHJlcXVpcmUoJy4vcmVuZGVyU2NvcGVDb250ZW50LmpzJyk7XHJcbnZhciBhbmNob3JNZ3IgPSByZXF1aXJlKCdmZy1qcy9hbmNob3JNZ3IuanMnKTtcclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZShjb250ZXh0LCBtZXRhLCBzY29wZVBhdGgsIHZhbHVlLCBvbGRWYWx1ZSl7XHJcblx0dmFyIHV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMnKTtcclxuXHR2YWx1ZSA9IHZhbHVlIHx8IFtdO1xyXG5cdG9sZFZhbHVlID0gb2xkVmFsdWUgfHwgW107XHJcblx0Zm9yICh2YXIgaSA9IHZhbHVlLmxlbmd0aDsgaSA8IG9sZFZhbHVlLmxlbmd0aDsgaSsrKXtcclxuXHRcdGNvbnRleHQuZ2FwU3RvcmFnZS5yZW1vdmVTY29wZShzY29wZVBhdGguY29uY2F0KFtpXSkpO1xyXG5cdH07XHJcblx0aWYgKHZhbHVlLmxlbmd0aCA+IG9sZFZhbHVlLmxlbmd0aCl7XHJcblx0XHR2YXIgZGF0YVNsaWNlID0gdmFsdWUuc2xpY2Uob2xkVmFsdWUubGVuZ3RoKTtcclxuXHRcdHZhciBuZXdDb250ZW50ID0gcmVuZGVyU2NvcGVDb250ZW50KGNvbnRleHQsIG1ldGEsIGRhdGFTbGljZSwgY29udGV4dC5kYXRhLCBvbGRWYWx1ZS5sZW5ndGgpLmpvaW4oJ1xcbicpO1xyXG5cdFx0dmFyIGFuY2hvciA9IGFuY2hvck1nci5maW5kKGNvbnRleHQsIG1ldGEpO1x0XHRcclxuXHRcdGFuY2hvck1nci5pbnNlcnRIVE1MKGFuY2hvciwgJ2JlZm9yZScsIG5ld0NvbnRlbnQpO1xyXG5cdH07XHJcblx0Ly9jb250ZXh0LnJlcmVuZGVyKGNvbnRleHQuZGF0YSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHVwZGF0ZTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmZ1bmN0aW9uIFN0clRwbCh0cGwsIHZhbHVlUGFyc2VGbil7XHJcblx0aWYgKHR5cGVvZiB0cGwgPT09IFwib2JqZWN0XCIpe1xyXG5cdFx0dGhpcy5zcmMgPSB0cGwuc3JjO1xyXG5cdFx0dGhpcy5nYXBzID0gdHBsLmdhcHM7XHJcblx0XHR0aGlzLnBhcnRzID0gdHBsLnBhcnRzO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH07XHJcbiAgICB0aGlzLnNyYyA9IHRwbDtcclxuICAgIHRoaXMucGFydHMgPSBbXTtcclxuICAgIHRoaXMuZ2FwcyA9IFtdO1xyXG4gICAgcmV0dXJuIHRoaXMucGFyc2UodHBsLCB2YWx1ZVBhcnNlRm4pO1xyXG59O1xyXG5cclxuU3RyVHBsLnJlYWQgPSBmdW5jdGlvbih0cGwsIHZhbHVlUGFyc2VGbil7XHJcblx0dmFyIHJlcyA9IG5ldyBTdHJUcGwodHBsLCB2YWx1ZVBhcnNlRm4pO1xyXG5cdGlmIChyZXMuaXNTdHJpbmcpe1xyXG5cdFx0cmVzID0gdHBsO1xyXG5cdH07XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbnZhciBnYXBSZSA9IC9bXFwkXFwjXFwhXXsxfVxce1teXFx9XSpcXH0vZ207XHJcblxyXG5TdHJUcGwucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24odHBsLCB2YWx1ZVBhcnNlRm4pe1xyXG5cdHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdGlmICghZ2FwU3RyQXJyKXtcclxuXHRcdHRoaXMuaXNTdHJpbmcgPSB0cnVlO1xyXG5cdFx0dGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH07XHJcblx0dGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdHZhciBwYXJ0VmFsdWUgPSBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHRcdHZhciBwYXJ0UmVzID0gdmFsdWVQYXJzZUZuKHBhcnRWYWx1ZSk7XHJcblx0XHRwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdHJldHVybiBwYXJ0UmVzO1xyXG5cdH0pO1x0XHRcclxuXHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcbmZ1bmN0aW9uIG1peEFycmF5cygvKmFycmF5cyovKXtcclxuXHR2YXIgbWF4TGVuZ3RoID0gMDtcclxuXHR2YXIgdG90YWxMZW5ndGggPSAwO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKXtcclxuXHRcdG1heExlbmd0aCA9IE1hdGgubWF4KGFyZ3VtZW50c1tpXS5sZW5ndGgsIG1heExlbmd0aCk7XHJcblx0XHR0b3RhbExlbmd0aCArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG5cdH07XHJcblx0dmFyIHJlc0FyciA9IFtdO1xyXG5cdHZhciBhcnJheUNvdW50ID0gYXJndW1lbnRzLmxlbmd0aDtcclxuXHRmb3IgKHZhciBpZCA9IDA7IGlkIDwgbWF4TGVuZ3RoOyBpZCsrKXtcdFx0XHRcdFxyXG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBhcnJheUNvdW50OyBqKyspe1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzW2pdLmxlbmd0aCA+IGlkKXtcclxuXHRcdFx0XHRyZXNBcnIucHVzaChhcmd1bWVudHNbal1baWRdKTtcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzQXJyO1xyXG59O1xyXG5cclxuU3RyVHBsLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbih2YWx1ZVJlbmRlckZuKXtcclxuXHR2YXIgZ2FwcyA9IHRoaXMuZ2Fwcy5tYXAodmFsdWVSZW5kZXJGbik7XHJcblx0dmFyIHBhcnRzID0gbWl4QXJyYXlzKHRoaXMucGFydHMsIGdhcHMpO1xyXG5cdHJldHVybiBwYXJ0cy5qb2luKCcnKTtcdFxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdHJUcGw7IiwidmFyIHV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMnKTtcclxuXHJcbmZ1bmN0aW9uIHJlbmRlclRwbCh0cGwsIHBhcmVudCwgZGF0YSwgbWV0YSl7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBwYXJ0cyA9IHRwbC5tYXAoZnVuY3Rpb24ocGFydCwgcGFydElkKXtcclxuXHRcdGlmICh0eXBlb2YgcGFydCA9PSBcInN0cmluZ1wiKXtcclxuXHRcdFx0cmV0dXJuIHBhcnQ7XHJcblx0XHR9O1xyXG5cdFx0dmFyIHBhcnRNZXRhID0gdXRpbHMuc2ltcGxlQ2xvbmUocGFydCk7XHJcblx0XHRpZiAobWV0YSl7XHJcblx0XHRcdGlmICh0eXBlb2YgbWV0YSA9PSBcImZ1bmN0aW9uXCIpe1xyXG5cdFx0XHRcdHBhcnRNZXRhID0gbWV0YShwYXJ0TWV0YSwgcGFydElkKTtcclxuXHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0cGFydE1ldGEgPSB1dGlscy5leHRlbmQocGFydE1ldGEsIG1ldGEgfHwge30pO1x0XHRcdFxyXG5cdFx0XHR9O1x0XHJcblx0XHR9O1x0XHRcclxuXHRcdHJldHVybiBzZWxmLmdhcENsYXNzTWdyLnJlbmRlcihzZWxmLmNvbnRleHQsIHBhcmVudCwgZGF0YSwgcGFydE1ldGEpO1xyXG5cdH0pO1xyXG5cdHZhciBjb2RlID0gcGFydHMuam9pbignJyk7XHJcblx0cmV0dXJuIGNvZGU7XHJcbn07XHJcblxyXG5leHBvcnRzLnJlbmRlclRwbCA9IHJlbmRlclRwbDsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0cGxVdGlscyA9IHJlcXVpcmUoJ2ZnLWpzL3V0aWxzL3RwbFV0aWxzLmpzJyk7XHJcbnZhciB2YWx1ZU1nciA9IHJlcXVpcmUoJ2ZnLWpzL3ZhbHVlTWdyLmpzJyk7XHJcbmV4dGVuZChleHBvcnRzLCB0cGxVdGlscyk7XHJcblxyXG5mdW5jdGlvbiBvYmpGb3Iob2JqLCBmbil7XHJcblx0Zm9yICh2YXIgaSBpbiBvYmope1xyXG5cdFx0Zm4ob2JqW2ldLCBpLCBvYmopO1xyXG5cdH07XHJcbn07XHJcbmV4cG9ydHMub2JqRm9yID0gb2JqRm9yO1xyXG5cclxuZnVuY3Rpb24gb2JqTWFwKG9iaiwgZm4pe1xyXG5cdHZhciBuZXdPYmogPSB7fTtcclxuXHRvYmpGb3Iob2JqLCBmdW5jdGlvbihpdGVtLCBpZCl7XHJcblx0XHR2YXIgbmV3SXRlbSA9IGZuKGl0ZW0sIGlkLCBvYmopO1xyXG5cdFx0bmV3T2JqW2lkXSA9IG5ld0l0ZW07XHJcblx0fSk7XHJcblx0cmV0dXJuIG5ld09iajtcclxufTtcclxuZXhwb3J0cy5vYmpNYXAgPSBvYmpNYXA7XHJcblxyXG5mdW5jdGlvbiBvYmpQYXRoKHBhdGgsIG9iaiwgbmV3VmFsKXtcclxuXHRpZiAocGF0aC5sZW5ndGggPCAxKXtcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMil7XHJcblx0XHRcdHRocm93ICdyb290IHJld3JpdHRpbmcgaXMgbm90IHN1cHBvcnRlZCc7XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIG9iajtcclxuXHR9O1xyXG5cdHZhciBwcm9wTmFtZSA9IHBhdGhbMF07XHJcblx0aWYgKHBhdGgubGVuZ3RoID09PSAxKXtcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMil7XHJcblx0XHRcdG9ialtwcm9wTmFtZV0gPSBuZXdWYWw7IFxyXG5cdFx0fTtcdFx0XHRcdFxyXG5cdFx0cmV0dXJuIG9ialtwcm9wTmFtZV07XHRcclxuXHR9O1xyXG5cdHZhciBzdWJPYmogPSBvYmpbcHJvcE5hbWVdO1xyXG5cdGlmIChzdWJPYmogPT09IHVuZGVmaW5lZCl7XHJcblx0XHQvL3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZWFkIFwiICsgcHJvcE5hbWUgKyBcIiBvZiB1bmRlZmluZWRcIik7XHJcblx0XHRyZXR1cm4gdW5kZWZpbmVkOyAvLyB0aHJvdz9cclxuXHR9O1x0XHRcclxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpe1xyXG5cdFx0cmV0dXJuIG9ialBhdGgocGF0aC5zbGljZSgxKSwgc3ViT2JqLCBuZXdWYWwpO1xyXG5cdH07XHJcblx0cmV0dXJuIG9ialBhdGgocGF0aC5zbGljZSgxKSwgc3ViT2JqKTtcclxufTtcclxuZXhwb3J0cy5vYmpQYXRoID0gb2JqUGF0aDtcclxuXHJcblxyXG5mdW5jdGlvbiBhdHRyc1RvT2JqKGF0dHJzKXtcclxuXHR2YXIgcmVzID0ge307XHJcblx0YXR0cnMuZm9yRWFjaChmdW5jdGlvbihpKXtcclxuXHRcdHJlc1tpLm5hbWVdID0gaS52YWx1ZTtcclxuXHR9KTsgXHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuZXhwb3J0cy5hdHRyc1RvT2JqID0gYXR0cnNUb09iajtcclxuXHJcblxyXG5mdW5jdGlvbiBzaW1wbGVDbG9uZShvYmope1xyXG5cdHZhciByZXMgPSB7fTtcclxuXHRmb3IgKHZhciBpIGluIG9iail7XHJcblx0XHRyZXNbaV0gPSBvYmpbaV07XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5leHBvcnRzLnNpbXBsZUNsb25lID0gc2ltcGxlQ2xvbmU7XHJcblxyXG5cclxuZnVuY3Rpb24gbWl4QXJyYXlzKC8qYXJyYXlzKi8pe1xyXG5cdHZhciBpZCA9IDA7XHJcblx0dmFyIG1heExlbmd0aCA9IDA7XHJcblx0dmFyIHRvdGFsTGVuZ3RoID0gMDtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKyl7XHJcblx0XHRtYXhMZW5ndGggPSBNYXRoLm1heChhcmd1bWVudHNbaV0ubGVuZ3RoLCBtYXhMZW5ndGgpO1xyXG5cdFx0dG90YWxMZW5ndGggKz0gYXJndW1lbnRzW2ldLmxlbmd0aDtcclxuXHR9O1xyXG5cdHZhciByZXNBcnIgPSBbXTtcclxuXHR2YXIgYXJyYXlDb3VudCA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcblx0Zm9yICh2YXIgaWQgPSAwOyBpZCA8IG1heExlbmd0aDsgaWQrKyl7XHRcdFx0XHRcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlDb3VudDsgaSsrKXtcclxuXHRcdFx0aWYgKGFyZ3VtZW50c1tpXS5sZW5ndGggPiBpZCl7XHJcblx0XHRcdFx0cmVzQXJyLnB1c2goYXJndW1lbnRzW2ldW2lkXSk7XHJcblx0XHRcdH07XHJcblx0XHR9O1xyXG5cdH07XHJcblx0cmV0dXJuIHJlc0FycjtcclxufTtcclxuZXhwb3J0cy5taXhBcnJheXMgPSBtaXhBcnJheXM7XHJcblxyXG5mdW5jdGlvbiByZXNvbHZlUGF0aChyb290UGF0aCwgcmVsUGF0aCl7XHJcblx0dmFyIHJlc1BhdGggPSByb290UGF0aC5zbGljZSgpO1xyXG5cdHJlbFBhdGggPSByZWxQYXRoIHx8IFtdO1xyXG5cdHJlbFBhdGguZm9yRWFjaChmdW5jdGlvbihrZXkpe1xyXG5cdFx0aWYgKGtleSA9PT0gXCJfcm9vdFwiKXtcclxuXHRcdFx0cmVzUGF0aCA9IFtdO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9O1xyXG5cdFx0cmVzUGF0aC5wdXNoKGtleSk7XHJcblx0fSk7XHJcblx0cmV0dXJuIHJlc1BhdGg7XHJcbn07XHJcbmV4cG9ydHMucmVzb2x2ZVBhdGggPSByZXNvbHZlUGF0aDtcclxuXHJcblxyXG5mdW5jdGlvbiBnZXRTY29wZVBhdGgobWV0YSl7XHJcblx0dmFyXHRwYXJlbnRQYXRoID0gW107XHJcblx0aWYgKG1ldGEucGFyZW50KXtcclxuXHRcdHBhcmVudFBhdGggPSBtZXRhLnBhcmVudC5zY29wZVBhdGg7XHJcblx0XHRpZiAoIXBhcmVudFBhdGgpe1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJQYXJlbnQgZWxtIG11c3QgaGF2ZSBzY29wZVBhdGhcIik7XHJcblx0XHR9O1xyXG5cdH07XHJcblx0cmV0dXJuIHJlc29sdmVQYXRoKHBhcmVudFBhdGgsIG1ldGEucGF0aCk7XHJcbn07XHJcbmV4cG9ydHMuZ2V0U2NvcGVQYXRoID0gZ2V0U2NvcGVQYXRoO1xyXG5cclxuZnVuY3Rpb24ga2V5VmFsdWVUb09iaihhcnIsIGtleU5hbWUsIHZhbHVlTmFtZSl7XHJcblx0a2V5TmFtZSA9IGtleU5hbWUgfHwgJ2tleSc7XHJcblx0dmFsdWVOYW1lID0gdmFsdWVOYW1lIHx8ICd2YWx1ZSc7XHJcblx0dmFyIHJlcyA9IHt9O1xyXG5cdGFyci5mb3JFYWNoKGZ1bmN0aW9uKGkpe1xyXG5cdFx0cmVzW2lba2V5TmFtZV1dID0gaVt2YWx1ZU5hbWVdO1xyXG5cdH0pOyBcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5leHBvcnRzLmtleVZhbHVlVG9PYmogPSBrZXlWYWx1ZVRvT2JqO1x0XHJcblxyXG5mdW5jdGlvbiBvYmpUb0tleVZhbHVlKG9iaiwga2V5TmFtZSwgdmFsdWVOYW1lKXtcclxuXHRrZXlOYW1lID0ga2V5TmFtZSB8fCAna2V5JztcclxuXHR2YWx1ZU5hbWUgPSB2YWx1ZU5hbWUgfHwgJ3ZhbHVlJztcclxuXHR2YXIgcmVzID0gW107XHJcblx0Zm9yICh2YXIgaSBpbiBvYmope1xyXG5cdFx0dmFyIGl0ZW0gPSB7fTtcclxuXHRcdGl0ZW1ba2V5TmFtZV0gPSBpO1xyXG5cdFx0aXRlbVt2YWx1ZU5hbWVdID0gb2JqW2ldO1xyXG5cdFx0cmVzLnB1c2goaXRlbSk7XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5leHBvcnRzLm9ialRvS2V5VmFsdWUgPSBvYmpUb0tleVZhbHVlO1xyXG5cclxuZnVuY3Rpb24gY2xvbmUob2JqKXtcclxuXHRyZXR1cm4gT2JqZWN0LmNyZWF0ZShvYmopO1xyXG59O1xyXG5leHBvcnRzLmNsb25lID0gY2xvbmU7XHJcblxyXG5cclxuZnVuY3Rpb24gY29uY2F0T2JqKG9iajEsIG9iajIpe1xyXG5cdHZhciByZXMgPSBzaW1wbGVDbG9uZShvYmoxKTtcclxuXHRmb3IgKHZhciBpIGluIG9iajIpe1xyXG5cdFx0cmVzW2ldID0gb2JqMltpXTtcclxuXHR9O1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcbmV4cG9ydHMuY29uY2F0T2JqID0gY29uY2F0T2JqO1xyXG5cclxuZnVuY3Rpb24gZXh0ZW5kKGRlc3QsIHNyYyl7XHRcclxuXHRmb3IgKHZhciBpIGluIHNyYyl7XHJcblx0XHRkZXN0W2ldID0gc3JjW2ldO1xyXG5cdH07XHJcblx0cmV0dXJuIGRlc3Q7XHJcbn07XHJcbmV4cG9ydHMuZXh0ZW5kID0gZXh0ZW5kO1xyXG5cclxuZnVuY3Rpb24gZmluZFNjb3BlSG9sZGVyKG1ldGEpe1xyXG4gICAgdmFyIG5vZGUgPSBtZXRhLnBhcmVudDtcclxuICAgIHdoaWxlIChub2RlKXtcclxuICAgICAgICBpZiAoIW5vZGUuaXNTY29wZUhvbGRlcil7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50OyAgXHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZmluZCBzY29wZSBob2xkZXInKTtcclxufTtcclxuZXhwb3J0cy5maW5kU2NvcGVIb2xkZXIgPSBmaW5kU2NvcGVIb2xkZXI7XHJcblxyXG5mdW5jdGlvbiByZW5kZXJTY29wZUNvbnRlbnQoY29udGV4dCwgc2NvcGVNZXRhLCBzY29wZURhdGEsIGRhdGEsIGlkT2Zmc2V0KXtcclxuXHR2YXIgZ2FwQ2xhc3NNZ3IgPSByZXF1aXJlKCdmZy1qcy9jbGllbnQvZ2FwQ2xhc3NNZ3IuanMnKTtcclxuXHR2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoc2NvcGVEYXRhKTtcclxuXHRpZiAoIWlzQXJyYXkpe1xyXG5cdFx0c2NvcGVEYXRhID0gW3Njb3BlRGF0YV07XHJcblx0fTtcclxuXHR2YXIgcGFydHMgPSBzY29wZURhdGEubWFwKGZ1bmN0aW9uKGRhdGFJdGVtLCBpZCl7XHJcblx0XHR2YXIgaXRlbU1ldGEgPSBzY29wZU1ldGE7XHJcblx0XHRpZiAoaXNBcnJheSl7XHJcblx0XHRcdHZhciBpdGVtQ2ZnID0ge1xyXG5cdFx0XHRcdFwidHlwZVwiOiBcInNjb3BlLWl0ZW1cIixcclxuXHRcdFx0XHRcImlzVmlydHVhbFwiOiB0cnVlLFxyXG5cdFx0XHRcdFwicGF0aFwiOiBbaWQgKyBpZE9mZnNldF0sXHJcblx0XHRcdFx0XCJjb250ZW50XCI6IHNjb3BlTWV0YS5jb250ZW50XHJcblx0XHRcdH07XHJcblx0XHRcdGlmIChzY29wZU1ldGEuZWlkKXtcclxuXHRcdFx0XHRpdGVtQ2ZnLmVpZCA9IHNjb3BlTWV0YS5laWQgKyAnLWl0ZW0nO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRpdGVtTWV0YSA9IG5ldyBnYXBDbGFzc01nci5HYXAoY29udGV4dCwgaXRlbUNmZywgaXRlbU1ldGEpO1xyXG5cdFx0XHRjb250ZXh0LmdhcFN0b3JhZ2Uuc2V0VHJpZ2dlcnMoaXRlbU1ldGEsIFtpdGVtTWV0YS5zY29wZVBhdGhdKTtcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gZ2FwQ2xhc3NNZ3IucmVuZGVyKGNvbnRleHQsIHNjb3BlTWV0YSwgZGF0YSwgaXRlbU1ldGEpO1xyXG5cdH0pO1xyXG5cdHJldHVybiBwYXJ0cztcclxufTtcclxuZXhwb3J0cy5yZW5kZXJTY29wZUNvbnRlbnQgPSByZW5kZXJTY29wZUNvbnRlbnQ7XHJcblxyXG5mdW5jdGlvbiBpbnNlcnRIVE1MQmVmb3JlQ29tbWVudChjb21tZW50RWxtLCBodG1sKXtcclxuXHR2YXIgcHJldiA9IGNvbW1lbnRFbG0ucHJldmlvdXNFbGVtZW50U2libGluZztcclxuXHRpZiAocHJldil7XHJcblx0XHRwcmV2Lmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJlbmQnLCBodG1sKTtcclxuXHRcdHJldHVybjtcclxuXHR9O1xyXG5cdGNvbW1lbnRFbG0ucGFyZW50Tm9kZS5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCBodG1sKTtcclxufTtcclxuZXhwb3J0cy5pbnNlcnRIVE1MQmVmb3JlQ29tbWVudCA9IGluc2VydEhUTUxCZWZvcmVDb21tZW50O1xyXG5cclxuXHJcbmZ1bmN0aW9uIHBhcnNlUGF0aChwYXJzZWROb2RlKXtcclxuXHRpZiAocGFyc2VkTm9kZS5hdHRycy5jbGFzcyl7XHJcblx0XHR2YXIgcGFydHMgPSBwYXJzZWROb2RlLmF0dHJzLmNsYXNzLnZhbHVlLnNwbGl0KCcgJyk7XHJcblx0XHR2YXIgcGFyc2VkID0gIHZhbHVlTWdyLnJlYWQocGFydHMpO1xyXG5cdFx0cmV0dXJuIHBhcnNlZDtcclxuXHR9O1xyXG5cdHJldHVybiB2YWx1ZU1nci5yZWFkKFtdKTtcclxufTtcclxuZXhwb3J0cy5wYXJzZVBhdGggPSBwYXJzZVBhdGg7XHJcblxyXG5mdW5jdGlvbiBvYmpNYXAob2JqLCBmbil7XHJcblx0dmFyIHJlcyA9IHt9O1xyXG5cdG9iakZvcihvYmosIGZ1bmN0aW9uKHZhbCwgaWQpe1xyXG5cdFx0cmVzW2lkXSA9IGZuKHZhbCwgaWQsIG9iaik7XHJcblx0fSk7XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuZXhwb3J0cy5vYmpNYXAgPSBvYmpNYXA7XHJcblxyXG5mdW5jdGlvbiBkZWVwQ2xvbmUob2JqKXtcclxuXHRpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIil7XHJcblx0XHR2YXIgbWFwID0gQXJyYXkuaXNBcnJheShvYmopXHJcblx0XHRcdD8gb2JqLm1hcC5iaW5kKG9iailcclxuXHRcdFx0OiBvYmpNYXAuYmluZChudWxsLCBvYmopO1xyXG5cdFx0cmV0dXJuIG1hcChkZWVwQ2xvbmUpO1xyXG5cdH07XHJcblx0cmV0dXJuIG9iajtcclxufTtcclxuZXhwb3J0cy5kZWVwQ2xvbmUgPSBkZWVwQ2xvbmU7XHJcblxyXG5mdW5jdGlvbiBnZXRBdHRyc1BhdGhzKGF0dHJzKXtcclxuXHR2YXIgcGF0aHMgPSBbXTtcclxuXHRvYmpGb3IoYXR0cnMsIGZ1bmN0aW9uKHZhbHVlLCBuYW1lKXtcclxuXHRcdHZhciBuYW1lVHBsID0gbmV3IFN0clRwbChuYW1lKTtcclxuXHRcdHZhciB2YWx1ZVRwbCA9IG5ldyBTdHJUcGwodmFsdWUpO1xyXG5cdFx0cGF0aHMgPSBwYXRocy5jb25jYXQobmFtZVRwbC5nZXRQYXRocygpLCB2YWx1ZVRwbC5nZXRQYXRocygpKTtcdFx0XHJcblx0fSk7XHJcblx0cmV0dXJuIHBhdGhzO1xyXG59O1xyXG5leHBvcnRzLmdldEF0dHJzUGF0aHMgPSBnZXRBdHRyc1BhdGhzO1xyXG5cclxuZnVuY3Rpb24gZXNjYXBlSHRtbChjb2RlKXtcclxuXHRyZXR1cm4gY29kZVxyXG5cdFx0LnJlcGxhY2UoL1wiL2csJyZxdW90OycpXHJcblx0XHQucmVwbGFjZSgvJi9nLCcmYW1wOycpXHJcblx0XHQucmVwbGFjZSgvPC9nLCcmbHQ7JylcclxuXHRcdC5yZXBsYWNlKC8+L2csJyZndDsnKTtcclxufTtcclxuZXhwb3J0cy5lc2NhcGVIdG1sID0gZXNjYXBlSHRtbDsiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCdmZy1qcy91dGlscy5qcycpO1xyXG5cclxudmFyIHNlbGZDbG9zaW5nVGFncyA9IFtcImFyZWFcIiwgXCJiYXNlXCIsIFwiYnJcIiwgXCJjb2xcIiwgXHJcblx0XCJjb21tYW5kXCIsIFwiZW1iZWRcIiwgXCJoclwiLCBcImltZ1wiLCBcclxuXHRcImlucHV0XCIsIFwia2V5Z2VuXCIsIFwibGlua1wiLCBcclxuXHRcIm1ldGFcIiwgXCJwYXJhbVwiLCBcInNvdXJjZVwiLCBcInRyYWNrXCIsIFxyXG5cdFwid2JyXCJdO1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyVGFnKHRhZ0luZm8pe1xyXG5cdHZhciBhdHRycyA9IHRhZ0luZm8uYXR0cnM7XHJcblx0aWYgKCFBcnJheS5pc0FycmF5KGF0dHJzKSl7XHJcblx0XHRhdHRycyA9IHV0aWxzLm9ialRvS2V5VmFsdWUoYXR0cnMsICduYW1lJywgJ3ZhbHVlJyk7XHJcblx0fTtcclxuXHR2YXIgYXR0ckNvZGUgPSBcIlwiO1xyXG5cdGlmIChhdHRycy5sZW5ndGggPiAwKXtcclxuXHQgICAgYXR0ckNvZGUgPSBcIiBcIiArIGF0dHJzLm1hcChmdW5jdGlvbihhdHRyKXtcclxuXHRcdCAgcmV0dXJuIGF0dHIubmFtZSArICc9XCInICsgYXR0ci52YWx1ZSArICdcIic7XHJcblx0ICAgfSkuam9pbignICcpO1xyXG5cdH07XHJcblx0dmFyIHRhZ0hlYWQgPSB0YWdJbmZvLm5hbWUgKyBhdHRyQ29kZTtcclxuXHRpZiAofnNlbGZDbG9zaW5nVGFncy5pbmRleE9mKHRhZ0luZm8ubmFtZSkpe1xyXG5cdFx0cmV0dXJuIFwiPFwiICsgdGFnSGVhZCArIFwiIC8+XCI7XHJcblx0fTtcclxuXHR2YXIgb3BlblRhZyA9IFwiPFwiICsgdGFnSGVhZCArIFwiPlwiO1xyXG5cdHZhciBjbG9zZVRhZyA9IFwiPC9cIiArIHRhZ0luZm8ubmFtZSArIFwiPlwiO1xyXG5cdHZhciBjb2RlID0gb3BlblRhZyArICh0YWdJbmZvLmlubmVySFRNTCB8fCBcIlwiKSArIGNsb3NlVGFnO1xyXG5cdHJldHVybiBjb2RlO1xyXG59O1xyXG5leHBvcnRzLnJlbmRlclRhZyA9IHJlbmRlclRhZztcdFxyXG5cclxuIiwiZnVuY3Rpb24gTm9kZShraW5kLCBwYXJlbnQsIGRhdGEpe1xyXG4gICAgdGhpcy5jaGlsZHJlbiA9IGtpbmQgPT0gJ2FycmF5J1xyXG4gICAgICAgID8gW11cclxuICAgICAgICA6IHt9OyAgIFxyXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XHJcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgdGhpcy5jaGlsZENvdW50ID0gMDtcclxufTtcclxuXHJcbk5vZGUucHJvdG90eXBlLmFkZENoaWxkID0gZnVuY3Rpb24obmFtZSwgZGF0YSl7XHJcbiAgICBpZiAodGhpcy5raW5kID09ICdhcnJheScpe1xyXG4gICAgICAgIGRhdGEgPSBuYW1lO1xyXG4gICAgICAgIG5hbWUgPSB0aGlzLmNoaWxkcmVuLmxlbmd0aDtcclxuICAgIH07XHJcbiAgICBkYXRhID0gZGF0YSB8fCB0aGlzLnJvb3QuaW5pdE5vZGUoKTtcclxuICAgIHZhciBjaGlsZCA9IG5ldyBOb2RlKHRoaXMua2luZCwgdGhpcywgZGF0YSk7XHJcbiAgICBjaGlsZC5pZCA9IG5hbWU7XHJcbiAgICBjaGlsZC5wYXRoID0gdGhpcy5wYXRoLmNvbmNhdChbbmFtZV0pO1xyXG4gICAgY2hpbGQucm9vdCA9IHRoaXMucm9vdDtcclxuICAgIHRoaXMuY2hpbGRDb3VudCsrO1xyXG4gICAgdGhpcy5jaGlsZHJlbltuYW1lXSA9IGNoaWxkO1xyXG4gICAgcmV0dXJuIGNoaWxkO1xyXG59O1xyXG5cclxuTm9kZS5wcm90b3R5cGUuZ2V0UGFyZW50cyA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcmVzID0gW107ICAgIFxyXG4gICAgdmFyIG5vZGUgPSB0aGlzO1xyXG4gICAgd2hpbGUgKHRydWUpe1xyXG4gICAgICAgIG5vZGUgPSBub2RlLnBhcmVudDtcclxuICAgICAgICBpZiAoIW5vZGUpe1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmVzLnB1c2gobm9kZSk7XHJcbiAgICB9OyAgXHJcbn07XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5jaGlsZEl0ZXJhdGUgPSBmdW5jdGlvbihmbil7XHJcbiAgICBmb3IgKHZhciBpIGluIHRoaXMuY2hpbGRyZW4pe1xyXG4gICAgICAgIGZuLmNhbGwodGhpcywgdGhpcy5jaGlsZHJlbltpXSwgaSk7ICBcclxuICAgIH07XHJcbn07XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5nZXRDaGlsZEFyciA9IGZ1bmN0aW9uKCl7XHJcbiAgICBpZiAodGhpcy5raW5kID09ICdhcnJheScpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuO1xyXG4gICAgfTtcclxuICAgIHZhciByZXMgPSBbXTtcclxuICAgIHRoaXMuY2hpbGRJdGVyYXRlKGZ1bmN0aW9uKGNoaWxkKXtcclxuICAgICAgICByZXMucHVzaChjaGlsZCk7XHJcbiAgICB9KTsgICAgICAgICAgICBcclxuICAgIHJldHVybiByZXM7XHJcbn07XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5nZXREZWVwQ2hpbGRBcnIgPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyIHJlcyA9IHRoaXMuZ2V0Q2hpbGRBcnIoKTtcclxuICAgIHRoaXMuY2hpbGRJdGVyYXRlKGZ1bmN0aW9uKGNoaWxkKXtcclxuICAgICAgIHJlcyA9IHJlcy5jb25jYXQoY2hpbGQuZ2V0RGVlcENoaWxkQXJyKCkpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuTm9kZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24ocGF0aCl7XHJcbiAgICB2YXIgbGVhZktleSA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcclxuICAgIHZhciBicmFuY2hQYXRoID0gcGF0aC5zbGljZSgwLCAtMSk7XHJcbiAgICB2YXIgYnJhbmNoID0gdGhpcy5ieVBhdGgoYnJhbmNoUGF0aCk7XHJcbiAgICBicmFuY2guY2hpbGRDb3VudC0tO1xyXG4gICAgdmFyIHJlcyA9IGJyYW5jaC5jaGlsZHJlbltsZWFmS2V5XTtcclxuICAgIGRlbGV0ZSBicmFuY2guY2hpbGRyZW5bbGVhZktleV07ICAgXHJcbiAgICByZXR1cm4gcmVzOyBcclxufTtcclxuXHJcbk5vZGUucHJvdG90eXBlLmJ5UGF0aCA9IGZ1bmN0aW9uKHBhdGgpeyAgICBcclxuICAgIGlmIChwYXRoLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICB2YXIgbm9kZSA9IHRoaXM7XHJcbiAgICB3aGlsZSAodHJ1ZSl7XHJcbiAgICAgICAgdmFyIGtleSA9IHBhdGhbMF07XHJcbiAgICAgICAgbm9kZSA9IG5vZGUuY2hpbGRyZW5ba2V5XTtcclxuICAgICAgICBpZiAoIW5vZGUpe1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHBhdGggPSBwYXRoLnNsaWNlKDEpO1xyXG4gICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7ICBcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufTtcclxuXHJcbk5vZGUucHJvdG90eXBlLmFjY2VzcyA9IGZ1bmN0aW9uKHBhdGgpe1xyXG4gICAgaWYgKHBhdGgubGVuZ3RoID09IDApe1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIHZhciBub2RlID0gdGhpcztcclxuICAgIHdoaWxlICh0cnVlKXtcclxuICAgICAgICB2YXIga2V5ID0gcGF0aFswXTtcclxuICAgICAgICB2YXIgcGFyZW50ID0gbm9kZTtcclxuICAgICAgICBub2RlID0gbm9kZS5jaGlsZHJlbltrZXldO1xyXG4gICAgICAgIGlmICghbm9kZSl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gdGhpcy5yb290LmluaXROb2RlKCk7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBub2RlID0gcGFyZW50LmFkZENoaWxkKGtleSwgZGF0YSk7XHJcbiAgICAgICAgICAgIHBhcmVudC5jaGlsZHJlbltrZXldID0gbm9kZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHBhdGggPSBwYXRoLnNsaWNlKDEpO1xyXG4gICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7ICBcclxuICAgICAgICB9O1xyXG4gICAgfTsgXHJcbn07XHJcblxyXG5mdW5jdGlvbiBUcmVlSGVscGVyKG9wdHMsIHJvb3REYXRhKXtcclxuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xyXG4gICAgb3B0cy5raW5kID0gb3B0cy5raW5kIHx8ICdhcnJheSc7XHJcbiAgICB2YXIgaW5pdE5vZGUgPSBvcHRzLmluaXROb2RlIHx8IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHt9O1xyXG4gICAgfTtcclxuICAgIHZhciBkYXRhID0gcm9vdERhdGEgfHwgaW5pdE5vZGUoKTtcclxuICAgIHZhciByb290Tm9kZSA9IG5ldyBOb2RlKG9wdHMua2luZCwgbnVsbCwgZGF0YSk7XHJcbiAgICByb290Tm9kZS5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgcm9vdE5vZGUucm9vdCA9IHJvb3ROb2RlO1xyXG4gICAgcm9vdE5vZGUucGF0aCA9IFtdO1xyXG4gICAgcm9vdE5vZGUuaW5pdE5vZGUgPSBpbml0Tm9kZTtcclxuICAgIHJldHVybiByb290Tm9kZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJlZUhlbHBlcjsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB1dGlscyA9IHJlcXVpcmUoJ2ZnLWpzL3V0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiByZWFkKHBhcnRzLCBleHRyYUluZm8pe1xyXG5cdHZhciBzb3VyY2UgPSBcImRhdGFcIjtcclxuXHR2YXIgcGF0aCA9IHBhcnRzLm1hcChmdW5jdGlvbihwYXJ0KXtcdFx0XHJcblx0XHRpZiAocGFydFswXSA9PT0gJyQnKXtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRvcDogcGFydC5zbGljZSgxKVxyXG5cdFx0XHR9O1xyXG5cdFx0fTtcclxuXHRcdHJldHVybiBwYXJ0OyBcclxuXHR9KTtcclxuXHR2YXIgcmVzID0ge1xyXG5cdFx0XCJzb3VyY2VcIjogc291cmNlLFxyXG5cdFx0XCJwYXRoXCI6IHBhdGhcclxuXHR9O1xyXG5cdGlmIChleHRyYUluZm8pe1xyXG5cdFx0dXRpbHMuZXh0ZW5kKHJlcywgZXh0cmFJbmZvKTtcclxuXHR9O1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcbmV4cG9ydHMucmVhZCA9IHJlYWQ7XHJcblxyXG5mdW5jdGlvbiBwYXJzZShzdHIsIGV4dHJhSW5mbyl7XHJcblx0dmFyIHBhcnRzID0gc3RyLnRyaW0oKS5zcGxpdCgnLicpO1xyXG5cdHJldHVybiByZWFkKHBhcnRzLCBleHRyYUluZm8pO1xyXG59O1xyXG5leHBvcnRzLnBhcnNlID0gcGFyc2U7XHJcblxyXG5mdW5jdGlvbiBmaW5kU2NvcGVQYXRoKG1ldGEpe1xyXG5cdHZhciBwYXJlbnQgPSBtZXRhLnBhcmVudDtcclxuXHR3aGlsZSAodHJ1ZSl7XHRcdFxyXG5cdFx0aWYgKCFwYXJlbnQpe1xyXG5cdFx0XHRyZXR1cm4gW107XHJcblx0XHR9O1xyXG5cdFx0aWYgKHBhcmVudC5zY29wZVBhdGgpe1xyXG5cdFx0XHRyZXR1cm4gcGFyZW50LnNjb3BlUGF0aDtcclxuXHRcdH07XHJcblx0XHRwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG5cdH07XHJcbn07XHJcblxyXG5mdW5jdGlvbiByZXNvbHZlUGF0aChtZXRhLCBwYXRoKXtcclxuXHR2YXIgc2NvcGVQYXRoID0gZmluZFNjb3BlUGF0aChtZXRhKTtcclxuXHR2YXIgcmVzID0ge1xyXG5cdFx0c291cmNlOiBcImRhdGFcIixcclxuXHRcdGVzY2FwZWQ6IHBhdGguZXNjYXBlZFxyXG5cdH07XHJcblx0cmVzLnBhdGggPSBzY29wZVBhdGguc2xpY2UoKTtcclxuXHRwYXRoLnBhdGguZm9yRWFjaChmdW5jdGlvbihrZXkpe1xyXG5cdFx0aWYgKHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIpe1xyXG5cdFx0XHRyZXMucGF0aC5wdXNoKGtleSk7XHRcdFx0XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH07XHJcblx0XHRpZiAoa2V5Lm9wID09PSBcInJvb3RcIil7XHJcblx0XHRcdHJlcy5wYXRoID0gW107XHJcblx0XHR9IGVsc2UgaWYgKGtleS5vcCA9PT0gXCJ1cFwiKXtcclxuXHRcdFx0cmVzLnBhdGgucG9wKCk7XHJcblx0XHR9O1xyXG5cdH0pO1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcbmV4cG9ydHMucmVzb2x2ZVBhdGggPSByZXNvbHZlUGF0aDtcclxuXHJcbmZ1bmN0aW9uIGdldFZhbHVlKG1ldGEsIGRhdGEsIGdhcEluZm8pe1xyXG5cdHZhciBzb3VyY2VUYWJsZSA9IHtcclxuXHRcdFwiZGF0YVwiOiBkYXRhLFxyXG5cdFx0XCJtZXRhXCI6IG1ldGFcclxuXHR9O1xyXG5cdHZhciBzb3VyY2VEYXRhID0gc291cmNlVGFibGVbZ2FwSW5mby5zb3VyY2VdO1xyXG5cdHZhciByZXMgPSB1dGlscy5vYmpQYXRoKGdhcEluZm8ucGF0aCwgc291cmNlRGF0YSk7XHJcblx0aWYgKGdhcEluZm8uZXNjYXBlZCl7XHJcblx0XHRyZXMgPSB1dGlscy5lc2NhcGVIdG1sKHJlcyk7XHRcdFxyXG5cdH07XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuZXhwb3J0cy5nZXRWYWx1ZSA9IGdldFZhbHVlO1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyKG1ldGEsIGRhdGEsIHJlc29sdmVkUGF0aCl7XHJcblx0cmV0dXJuIGdldFZhbHVlKG1ldGEsIGRhdGEsIHJlc29sdmVkUGF0aCkudG9TdHJpbmcoKTtcclxufTtcclxuZXhwb3J0cy5yZW5kZXIgPSByZW5kZXI7XHJcblxyXG5mdW5jdGlvbiByZXNvbHZlQW5kUmVuZGVyKG1ldGEsIGRhdGEsIHBhdGgpe1xyXG5cdHZhciByZXNvbHZlZFBhdGggPSByZXNvbHZlUGF0aChtZXRhLCBwYXRoKTtcclxuXHRyZXR1cm4gcmVuZGVyKG1ldGEsIGRhdGEsIHJlc29sdmVkUGF0aCk7XHJcbn07XHJcbmV4cG9ydHMucmVzb2x2ZUFuZFJlbmRlciA9IHJlc29sdmVBbmRSZW5kZXI7XHJcbiJdfQ==
