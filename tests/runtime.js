(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"fg-js/client/fgInstance.js":2,"fg-js/client/globalEvents.js":6,"fg-js/eventEmitter.js":9}],2:[function(require,module,exports){
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
},{"./helper.js":7,"fg-js/client/gapClassMgr.js":3,"fg-js/client/gapStorage.js":4,"fg-js/client/globalEvents.js":6,"fg-js/eventEmitter.js":9,"fg-js/tplRender.js":24,"fg-js/utils.js":25}],3:[function(require,module,exports){
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
},{"fg-js/utils":25,"fg-js/valueMgr":28}],4:[function(require,module,exports){
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

},{"fg-js/utils.js":25,"fg-js/utils/treeHelper.js":27}],5:[function(require,module,exports){
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
},{"../gaps/content/render.js":10,"../gaps/content/update.js":11,"../gaps/data/render.js":12,"../gaps/data/update.js":13,"../gaps/fg/render.js":14,"../gaps/fg/update.js":15,"../gaps/raw/render.js":16,"../gaps/raw/update.js":17,"../gaps/scope-item/render.js":18,"../gaps/scope-item/update.js":19,"../gaps/scope/render.js":20,"../gaps/scope/update.js":22,"fg-js/client/gapClassMgr.js":3}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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
},{"fg-js/client/fgClass.js":1,"fg-js/client/fgInstance.js":2}],8:[function(require,module,exports){
require('./gaps.js');
var fgHelper = require('./helper.js');
},{"./gaps.js":5,"./helper.js":7}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
function render(context, data){
	this.scopePath = context.gapMeta.scopePath;
	return context.parent.renderTpl(context.meta.content, context.gapMeta.parent, context.parent.data);
};

module.exports = render;
},{}],11:[function(require,module,exports){
function update(context, meta, scopePath, value){
	return;
};

module.exports = update;
},{}],12:[function(require,module,exports){
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
},{"fg-js/utils":25,"fg-js/valueMgr":28}],13:[function(require,module,exports){
function update(context, meta, scopePath, value){
	var node = meta.getDom()[0];
	if (!node){
		
	};
	node.innerHTML = value;
	//highlight(node, [0xffffff, 0xffee88], 500);
};

module.exports = update;
},{}],14:[function(require,module,exports){
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
},{"fg-js/utils":25,"fg-js/valueMgr.js":28}],15:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11}],16:[function(require,module,exports){
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
},{"fg-js/strTpl.js":23,"fg-js/utils":25,"fg-js/valueMgr":28}],17:[function(require,module,exports){
function update(context, meta, scopePath, value){
	// to do value update
	var valueMgr = require('fg-js/valueMgr');
	var utils = require('fg-js/utils');
	var StrTpl = require('fg-js/strTpl.js');

	function renderAttrs(attrs, data){
		var resAttrs = {};
		utils.objFor(attrs, function(value, name){
			var nameTpl = new StrTpl(name);
			var valueTpl = new StrTpl(value);
			resAttrs[nameTpl.render(data)] = valueTpl.render(data);		
		});	
		return resAttrs;
	};

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
	if (meta.value && meta.valuePath.path.join('-') == scopePath.join('-')){
		dom.innerHTML = value;
	};
	utils.objFor(attrObj, function(value, name){
		var oldVal = dom.getAttribute(name);
		if (oldVal != value){
			dom.setAttribute(name, value);
		};
	});		
};

module.exports = update;
},{"fg-js/strTpl.js":23,"fg-js/utils":25,"fg-js/valueMgr":28}],18:[function(require,module,exports){
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
},{"fg-js/utils":25,"fg-js/valueMgr.js":28}],19:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11}],20:[function(require,module,exports){
var utils = require('fg-js/utils');
var valueMgr = require('fg-js/valueMgr.js');
var gapClassMgr = require('fg-js/client/gapClassMgr.js');
var renderScopeContent = require('./renderScopeContent.js');

function render(context, data){
	var meta = this;
	meta.items = [];
	//meta.scopePath = utils.getScopePath(meta);		
	//var scopeData = utils.objPath(meta.scopePath, data);
	var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
	this.scopePath = this.resolvedPath.path;
	var placeHolderInner = ['fg', context.id, 'scope-gid', meta.gid].join('-');
	if (!scopeData){
		return '<!--' + placeHolderInner + '-->';
	};		
	var parts = renderScopeContent(context, meta, scopeData, data, 0);
	parts.push('<!--' + placeHolderInner + '-->');
	return parts.join('\n');
};

module.exports = render;
},{"./renderScopeContent.js":21,"fg-js/client/gapClassMgr.js":3,"fg-js/utils":25,"fg-js/valueMgr.js":28}],21:[function(require,module,exports){
var utils = require('fg-js/utils');
var valueMgr = require('fg-js/valueMgr.js');
var gapClassMgr = require('fg-js/client/gapClassMgr.js');

function renderScopeContent(context, scopeMeta, scopeData, data, idOffset){
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
				"path": valueMgr.read([(id + idOffset).toString()]),
				"content": scopeMeta.content
			};
			if (scopeMeta.eid){
				itemCfg.eid = scopeMeta.eid + '-item';
			};
			itemMeta = new gapClassMgr.Gap(context, itemCfg, itemMeta);
		};
		return gapClassMgr.render(context, scopeMeta, data, itemMeta);
	});
	return parts;
};

module.exports = renderScopeContent;
},{"fg-js/client/gapClassMgr.js":3,"fg-js/utils":25,"fg-js/valueMgr.js":28}],22:[function(require,module,exports){
var renderScopeContent = require('./renderScopeContent.js');

function update(context, meta, scopePath, value, oldValue){
	var utils = require('fg-js/utils');
	var gapClassMgr = require('fg-js/client/gapClassMgr.js');
	value = value || [];
	oldValue = oldValue || [];
	for (var i = value.length; i < oldValue.length; i++){
		context.gapStorage.removeScope(scopePath.concat([i]));
	};
	if (value.length > oldValue.length){
		var scopeHolder = utils.findScopeHolder(meta);
		var nodes = [].slice.call(scopeHolder.getDom()[0].childNodes);
		var placeHolderInner = ['fg', context.id, 'scope-gid', meta.gid].join('-');
		var found = nodes.filter(function(node){
		    if (node.nodeType != 8){
		        return false
		    };
		    if (node.textContent == placeHolderInner){
		    	return true;
		    };			    
		});
		found = found[0];
		var dataSlice = value.slice(oldValue.length);
		var newContent = renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
		utils.insertHTMLBeforeComment(found, newContent);
	};
	this;
	//context.rerender(context.data);
};

module.exports = update;
},{"./renderScopeContent.js":21,"fg-js/client/gapClassMgr.js":3,"fg-js/utils":25}],23:[function(require,module,exports){
function StrTpl(tpl, valueParseFn){
	if (typeof tpl == "object"){
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

var gapRe = /\$\{[^\}]*\}/gm;

StrTpl.prototype.parse = function(tpl, valueParseFn){
	var gapStrArr = tpl.match(gapRe)
	if (!gapStrArr){
		this.isString = true;
		this.parts = [tpl];
		return;
	};
	gapStrArr = gapStrArr.map(function(part){
		return part.slice(2, -1);
	});	
	this.gaps = gapStrArr.map(valueParseFn);
	this.parts = tpl.split(gapRe);
	return this;
};

function mixArrays(arrays){
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

StrTpl.prototype.render = function(valueRenderFn){
	var gaps = this.gaps.map(valueRenderFn);
	var parts = mixArrays(this.parts, gaps);
	return parts.join('');	
};

module.exports = StrTpl;
},{}],24:[function(require,module,exports){
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
},{"fg-js/utils":25}],25:[function(require,module,exports){
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
	if (path.length == 1){
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


function mixArrays(arrays){
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
		if (key == "_root"){
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
	return resolvePath(parentPath, meta.path)
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
        if (node.isScopeHolder){
            return node;
        };
        node = node.parent;  
    };
    throw 'cannot find scope holder';
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
	if (typeof obj == "object"){
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
},{"fg-js/client/gapClassMgr.js":3,"fg-js/utils/tplUtils.js":26,"fg-js/valueMgr.js":28}],26:[function(require,module,exports){
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


},{"fg-js/utils.js":25}],27:[function(require,module,exports){
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
},{}],28:[function(require,module,exports){
var utils = require('fg-js/utils');

function read(parts){
	var source = "data";
	var path = parts.map(function(part){		
		if (part[0] == '$'){
			return {
				op: part.slice(1)
			};
		};
		return part; 
	});
	return {
		"source": source,
		"path": path
	};
};
exports.read = read;

function parse(str){
	var parts = str.split('.');
	return read(parts);
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
		source: "data"
	};
	res.path = scopePath.slice();
	path.path.forEach(function(key){
		if (typeof key == "string"){
			res.path.push(key);			
			return;
		};
		if (key.op == "root"){
			res.path = [];
		} else if (key.op == "up"){
			res.path.pop();
		};
	});
	return res;
};
exports.resolvePath = resolvePath;

function getValue(meta, data, resolvedPath){
	var sourceTable = {
		"data": data,
		"meta": meta
	};
	var sourceData = sourceTable[resolvedPath.source];
	var res = utils.objPath(resolvedPath.path, sourceData);
	return res;
};
exports.getValue = getValue;

function render(meta, data, resolvedPath){
	return getValue(meta, data, resolvedPath).toString();
};
exports.render = render;

function resolveAndRender(meta, data, path){
	var resolvedPath = resolvePath(meta, path);
	return render(meta, data, path);
};
exports.resolveAndRender = resolveAndRender;

},{"fg-js/utils":25}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9mZy1qcy9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2NsaWVudC9mZ0NsYXNzLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2NsaWVudC9mZ0luc3RhbmNlLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2NsaWVudC9nYXBDbGFzc01nci5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9jbGllbnQvZ2FwU3RvcmFnZS5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9jbGllbnQvZ2Fwcy5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9jbGllbnQvZ2xvYmFsRXZlbnRzLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2NsaWVudC9oZWxwZXIuanMiLCJub2RlX21vZHVsZXMvZmctanMvY2xpZW50L21haW4uanMiLCJub2RlX21vZHVsZXMvZmctanMvZXZlbnRFbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2dhcHMvY29udGVudC9yZW5kZXIuanMiLCJub2RlX21vZHVsZXMvZmctanMvZ2Fwcy9jb250ZW50L3VwZGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9nYXBzL2RhdGEvcmVuZGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2dhcHMvZGF0YS91cGRhdGUuanMiLCJub2RlX21vZHVsZXMvZmctanMvZ2Fwcy9mZy9yZW5kZXIuanMiLCJub2RlX21vZHVsZXMvZmctanMvZ2Fwcy9yYXcvcmVuZGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2dhcHMvcmF3L3VwZGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy9nYXBzL3Njb3BlLWl0ZW0vcmVuZGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2dhcHMvc2NvcGUvcmVuZGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2dhcHMvc2NvcGUvcmVuZGVyU2NvcGVDb250ZW50LmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL2dhcHMvc2NvcGUvdXBkYXRlLmpzIiwibm9kZV9tb2R1bGVzL2ZnLWpzL3N0clRwbC5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy90cGxSZW5kZXIuanMiLCJub2RlX21vZHVsZXMvZmctanMvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvZmctanMvdXRpbHMvdHBsVXRpbHMuanMiLCJub2RlX21vZHVsZXMvZmctanMvdXRpbHMvdHJlZUhlbHBlci5qcyIsIm5vZGVfbW9kdWxlcy9mZy1qcy92YWx1ZU1nci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdmZy1qcy9ldmVudEVtaXR0ZXIuanMnKTtcclxudmFyIGdsb2JhbEV2ZW50cyA9IHJlcXVpcmUoJ2ZnLWpzL2NsaWVudC9nbG9iYWxFdmVudHMuanMnKTtcclxudmFyIGZnSW5zdGFuY2VNb2R1bGUgPSByZXF1aXJlKCdmZy1qcy9jbGllbnQvZmdJbnN0YW5jZS5qcycpO1xyXG5cclxudmFyIGZnQ2xhc3NUYWJsZSA9IFtdO1xyXG52YXIgZmdDbGFzc0RpY3QgPSB7fTtcclxuXHJcbmZ1bmN0aW9uIEZnQ2xhc3Mob3B0cyl7XHJcblx0dGhpcy5pZCA9IGZnQ2xhc3NUYWJsZS5sZW5ndGg7XHRcclxuXHR0aGlzLmluc3RhbmNlcyA9IFtdO1xyXG5cdHRoaXMudHBsID0gb3B0cy50cGw7XHJcblx0dGhpcy5uYW1lID0gb3B0cy5uYW1lO1xyXG5cdHRoaXMuZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG5cdGZnQ2xhc3NEaWN0W29wdHMubmFtZV0gPSB0aGlzO1xyXG5cdGZnQ2xhc3NUYWJsZS5wdXNoKHRoaXMpO1x0XHJcblx0ZnVuY3Rpb24gRmdJbnN0YW5jZSgpe1xyXG5cdFx0ZmdJbnN0YW5jZU1vZHVsZS5GZ0luc3RhbmNlQmFzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdH07XHJcblx0dGhpcy5jcmVhdGVGbiA9IEZnSW5zdGFuY2U7XHJcblx0dGhpcy5jcmVhdGVGbi5jb25zdHJ1Y3RvciA9IGZnSW5zdGFuY2VNb2R1bGUuRmdJbnN0YW5jZUJhc2U7XHRcclxuXHR0aGlzLmNyZWF0ZUZuLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoZmdJbnN0YW5jZU1vZHVsZS5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUpO1x0XHJcblx0dmFyIGNsYXNzRm4gPSBvcHRzLmNsYXNzRm47XHJcblx0aWYgKGNsYXNzRm4pe1xyXG5cdFx0Y2xhc3NGbih0aGlzLCB0aGlzLmNyZWF0ZUZuLnByb3RvdHlwZSk7XHJcblx0fTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG1hdGNoKGZnLCBub2RlLCBzZWxlY3Rvcil7XHJcblx0dmFyIGRvbUVsbXMgPSBmZy5nZXREb20oKTtcclxuXHR3aGlsZSAobm9kZSl7XHJcblx0XHRpZiAobm9kZS5tYXRjaGVzKHNlbGVjdG9yKSl7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fTtcclxuXHRcdGlmIChkb21FbG1zLmluZGV4T2Yobm9kZSkgPj0gMCl7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH07XHRcdFxyXG5cdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcclxuXHR9O1xyXG5cdHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbkZnQ2xhc3MucHJvdG90eXBlLm9uID0gZnVuY3Rpb24obmFtZSwgc2VsZWN0b3IsIGZuKXtcdFxyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKXtcclxuXHRcdG5hbWUgPSBuYW1lO1xyXG5cdFx0Zm4gPSBhcmd1bWVudHNbMV07XHJcblx0XHRzZWxlY3RvciA9IG51bGw7XHJcblx0fWVsc2V7XHJcblx0XHR2YXIgb3JpZ2luYWxGbiA9IGZuO1xyXG5cdFx0Zm4gPSBmdW5jdGlvbihldmVudCl7XHRcdFx0XHJcblx0XHRcdGlmIChtYXRjaCh0aGlzLCBldmVudC50YXJnZXQsIHNlbGVjdG9yKSl7XHJcblx0XHRcdFx0b3JpZ2luYWxGbi5jYWxsKHRoaXMsIGV2ZW50KTtcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0fTtcclxuXHRnbG9iYWxFdmVudHMubGlzdGVuKG5hbWUpO1xyXG5cdHRoaXMuZXZlbnRFbWl0dGVyLm9uKG5hbWUsIGZuKTtcdFxyXG59O1xyXG5cclxuRmdDbGFzcy5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKC8qbmFtZS4uLiwgcmVzdCovKXtcclxuXHR0aGlzLmV2ZW50RW1pdHRlci5lbWl0LmFwcGx5KHRoaXMuZXZlbnRFbWl0dGVyLCBhcmd1bWVudHMpO1x0XHJcbn07XHJcblxyXG5GZ0NsYXNzLnByb3RvdHlwZS5lbWl0QXBwbHkgPSBmdW5jdGlvbihuYW1lLCB0aGlzQXJnLCBhcmdzKXtcclxuXHR0aGlzLmV2ZW50RW1pdHRlci5lbWl0QXBwbHkobmFtZSwgdGhpc0FyZywgYXJncyk7XHRcclxufTtcclxuXHJcbkZnQ2xhc3MucHJvdG90eXBlLmNvb2tEYXRhID0gZnVuY3Rpb24oZGF0YSl7XHJcblx0cmV0dXJuIGRhdGE7XHJcbn07XHJcblxyXG5GZ0NsYXNzLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihkYXRhLCBtZXRhLCBwYXJlbnQpe1xyXG5cdGlmIChkYXRhIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpe1xyXG5cdFx0cmV0dXJuIHRoaXMucmVuZGVySW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHR9O1xyXG5cdHZhciBmZyA9IG5ldyBmZ0luc3RhbmNlTW9kdWxlLkZnSW5zdGFuY2UodGhpcywgcGFyZW50KTtcclxuXHRmZy5jb2RlID0gZmcuZ2V0SHRtbChkYXRhLCBtZXRhKTtcclxuXHRyZXR1cm4gZmc7XHJcbn07XHJcblxyXG5GZ0NsYXNzLnByb3RvdHlwZS5yZW5kZXJJbiA9IGZ1bmN0aW9uKHBhcmVudE5vZGUsIGRhdGEsIG1ldGEsIHBhcmVudCl7XHJcblx0dmFyIGZnID0gdGhpcy5yZW5kZXIoZGF0YSwgbWV0YSwgcGFyZW50KTtcclxuXHRwYXJlbnROb2RlLmlubmVySFRNTCA9IGZnLmNvZGU7XHJcblx0ZmcuYXNzaWduKCk7XHJcblx0cmV0dXJuIGZnO1xyXG59O1xyXG5cclxuRmdDbGFzcy5wcm90b3R5cGUuYXBwZW5kVG8gPSBmdW5jdGlvbihwYXJlbnROb2RlLCBkYXRhKXtcclxuXHR2YXIgZmcgPSB0aGlzLnJlbmRlcihkYXRhKTtcdFxyXG5cdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRkaXYuaW5uZXJIVE1MID0gZmcuY29kZTtcclxuXHRbXS5zbGljZS5jYWxsKGRpdi5jaGlsZHJlbikuZm9yRWFjaChmdW5jdGlvbihjaGlsZCl7XHJcblx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuXHR9KTtcclxuXHRmZy5hc3NpZ24oKTtcclxufTtcclxuXHJcbmV4cG9ydHMuRmdDbGFzcyA9IEZnQ2xhc3M7XHJcbmV4cG9ydHMuZmdDbGFzc0RpY3QgPSBmZ0NsYXNzRGljdDtcclxuZXhwb3J0cy5mZ0NsYXNzVGFibGUgPSBmZ0NsYXNzVGFibGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgZ2FwQ2xhc3NNZ3IgPSByZXF1aXJlKCdmZy1qcy9jbGllbnQvZ2FwQ2xhc3NNZ3IuanMnKTtcclxudmFyIHJlbmRlclRwbCA9IHJlcXVpcmUoJ2ZnLWpzL3RwbFJlbmRlci5qcycpLnJlbmRlclRwbDtcclxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2ZnLWpzL2V2ZW50RW1pdHRlci5qcycpO1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCdmZy1qcy91dGlscy5qcycpO1xyXG52YXIgR2FwU3RvcmFnZSA9IHJlcXVpcmUoJ2ZnLWpzL2NsaWVudC9nYXBTdG9yYWdlLmpzJykuR2FwU3RvcmFnZTtcclxudmFyIGhlbHBlciA9IHJlcXVpcmUoJy4vaGVscGVyLmpzJyk7XHJcbnZhciBnbG9iYWxFdmVudHMgPSByZXF1aXJlKCdmZy1qcy9jbGllbnQvZ2xvYmFsRXZlbnRzLmpzJyk7XHJcblxyXG52YXIgZmdJbnN0YW5jZVRhYmxlID0gW107XHJcblxyXG5mdW5jdGlvbiBGZ0luc3RhbmNlQmFzZShmZ0NsYXNzLCBwYXJlbnQpe1xyXG5cdHRoaXMuaWQgPSBmZ0luc3RhbmNlVGFibGUubGVuZ3RoO1xyXG5cdGZnQ2xhc3MuaW5zdGFuY2VzLnB1c2godGhpcyk7XHJcblx0dGhpcy5uYW1lID0gZmdDbGFzcy5uYW1lO1xyXG5cdHRoaXMuZmdDbGFzcyA9IGZnQ2xhc3M7XHJcblx0dGhpcy5jb2RlID0gbnVsbDtcclxuXHR0aGlzLnBhcmVudCA9IHBhcmVudCB8fCBudWxsO1xyXG5cdHRoaXMuZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcihmZ0NsYXNzLmV2ZW50RW1pdHRlcik7XHJcblx0dGhpcy5lbWl0QXBwbHkgPSB0aGlzLmV2ZW50RW1pdHRlci5lbWl0QXBwbHkuYmluZCh0aGlzLmV2ZW50RW1pdHRlcik7XHJcblx0dGhpcy5nYXBTdG9yYWdlID0gbmV3IEdhcFN0b3JhZ2UodGhpcyk7XHJcblx0dGhpcy5jaGlsZEZncyA9IFtdO1xyXG5cdGZnSW5zdGFuY2VUYWJsZS5wdXNoKHRoaXMpO1x0XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudCwgZm4pe1xyXG5cdGdsb2JhbEV2ZW50cy5saXN0ZW4oZXZlbnQpO1xyXG5cdHRoaXMuZXZlbnRFbWl0dGVyLm9uKGV2ZW50LCBmbik7XHRcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oLypuYW1lLi4uLCByZXN0Ki8pe1xyXG5cdHRoaXMuZXZlbnRFbWl0dGVyLmVtaXQuYXBwbHkodGhpcy5ldmVudEVtaXR0ZXIsIGFyZ3VtZW50cyk7XHRcclxufTtcclxuXHJcbmZ1bmN0aW9uIEZnSW5zdGFuY2UoZmdDbGFzcywgcGFyZW50KXtcclxuXHRyZXR1cm4gbmV3IGZnQ2xhc3MuY3JlYXRlRm4oZmdDbGFzcywgcGFyZW50KTtcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIHRoaXMuY29kZTtcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5hc3NpZ24gPSBmdW5jdGlvbigpe1xyXG5cdHRoaXMuZW1pdEFwcGx5KCdyZWFkeScsIHRoaXMsIFtdKTtcclxuXHR0aGlzLmRvbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZy1paWQtJyArIHRoaXMuaWQpO1xyXG5cdHRoaXMuZ2FwU3RvcmFnZS5hc3NpZ24oKTtcclxuXHRyZXR1cm4gdGhpcy5kb207XHJcbn07XHJcblxyXG5mdW5jdGlvbiBnZXRDbGFzc2VzKG1ldGEpe1xyXG5cdGlmICghbWV0YSB8fCAhbWV0YS5hdHRycyB8fCAhbWV0YS5hdHRycy5jbGFzcyl7XHJcblx0XHRyZXR1cm4gW107XHJcblx0fTtcclxuXHRpZiAoQXJyYXkuaXNBcnJheShtZXRhLmF0dHJzLmNsYXNzKSl7XHJcblx0XHRyZXR1cm4gbWV0YS5hdHRycy5jbGFzcztcclxuXHR9O1x0XHRcclxuXHRyZXR1cm4gbWV0YS5hdHRycy5jbGFzcy5zcGxpdCgnICcpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gbWV0YU1hcChmZywgbWV0YVBhcnQpe1xyXG5cdHZhciByZXMgPSB1dGlscy5zaW1wbGVDbG9uZShtZXRhUGFydCk7XHJcblx0dmFyIGNsYXNzZXMgPSBnZXRDbGFzc2VzKHJlcyk7XHJcblx0dmFyIGZnX2NpZCA9IFwiZmctY2lkLVwiICsgZmcuZmdDbGFzcy5pZDtcclxuXHRyZXMuYXR0cnMgPSB1dGlscy5zaW1wbGVDbG9uZShtZXRhUGFydC5hdHRycyk7XHJcblx0aWYgKEFycmF5LmlzQXJyYXkocmVzLmF0dHJzLmNsYXNzKSl7XHJcblx0XHRyZXMuYXR0cnMuY2xhc3MgPSBbJ2ZnJywgJyAnLCBmZ19jaWQsICcgJ10uY29uY2F0KGNsYXNzZXMpO1xyXG5cdFx0cmV0dXJuIHJlcztcdFxyXG5cdH07XHRcclxuXHRyZXMuYXR0cnMuY2xhc3MgPSBbJ2ZnJywgZmdfY2lkXS5jb25jYXQoY2xhc3Nlcykuam9pbignICcpO1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUucmVuZGVyVHBsID0gZnVuY3Rpb24odHBsLCBwYXJlbnQsIGRhdGEsIG1ldGEpe1xyXG5cdHJldHVybiByZW5kZXJUcGwuY2FsbCh7XHJcblx0XHRcImdhcENsYXNzTWdyXCI6IGdhcENsYXNzTWdyLFxyXG5cdFx0XCJjb250ZXh0XCI6IHRoaXNcclxuXHR9LCB0cGwsIHBhcmVudCwgZGF0YSwgbWV0YSk7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuZ2V0SHRtbCA9IGZ1bmN0aW9uKGRhdGEsIG1ldGEpe1xyXG5cdHRoaXMuZGF0YSA9IGRhdGE7XHJcblx0dGhpcy5nYXBNZXRhID0gbWV0YTtcclxuXHR2YXIgcm9vdEdhcCA9IG5ldyBnYXBDbGFzc01nci5HYXAodGhpcywgbWV0YSk7XHJcblx0cm9vdEdhcC50eXBlID0gXCJyb290XCI7XHJcblx0cm9vdEdhcC5pc1ZpcnR1YWwgPSB0cnVlO1xyXG5cdHJvb3RHYXAuZmcgPSB0aGlzO1xyXG5cdHJvb3RHYXAuc2NvcGVQYXRoID0gW107XHJcblx0dGhpcy5tZXRhID0gcm9vdEdhcDtcclxuXHR2YXIgY29va2VkRGF0YSA9IHRoaXMuZmdDbGFzcy5jb29rRGF0YShkYXRhKTtcclxuXHRyZXR1cm4gdGhpcy5yZW5kZXJUcGwodGhpcy5mZ0NsYXNzLnRwbCwgcm9vdEdhcCwgY29va2VkRGF0YSwgbWV0YU1hcC5iaW5kKG51bGwsIHRoaXMpKTtcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihzY29wZVBhdGgsIG5ld1ZhbHVlKXtcclxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCl7XHJcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoW10sIHRoaXMuZGF0YSk7IC8vIHRvZG9cclxuXHR9O1xyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKXtcclxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZShbXSwgYXJndW1lbnRzWzBdKTtcclxuXHR9O1xyXG5cdHZhciB2YWx1ZSA9IHV0aWxzLmRlZXBDbG9uZShuZXdWYWx1ZSk7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBvbGRWYWx1ZSA9IHV0aWxzLm9ialBhdGgoc2NvcGVQYXRoLCB0aGlzLmRhdGEpO1xyXG5cdGlmIChvbGRWYWx1ZSA9PT0gdmFsdWUpe1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fTtcdFxyXG5cdHRoaXMuZW1pdCgndXBkYXRlJywgc2NvcGVQYXRoLCBuZXdWYWx1ZSk7XHJcblx0aWYgKHNjb3BlUGF0aC5sZW5ndGggPiAwKXtcclxuXHRcdHV0aWxzLm9ialBhdGgoc2NvcGVQYXRoLCB0aGlzLmRhdGEsIHZhbHVlKTtcclxuXHR9ZWxzZXtcclxuXHRcdHRoaXMuZGF0YSA9IHZhbHVlO1xyXG5cdH1cclxuXHR2YXIgc2NvcGUgPSB0aGlzLmdhcFN0b3JhZ2UuYnlTY29wZShzY29wZVBhdGgpO1xyXG5cdHZhciBnYXBzID0gc2NvcGUudGFyZ2V0O1xyXG5cdGdhcHMuZm9yRWFjaChmdW5jdGlvbihnYXApe1xyXG5cdFx0Z2FwQ2xhc3NNZ3IudXBkYXRlKHNlbGYsIGdhcCwgc2NvcGVQYXRoLCB2YWx1ZSwgb2xkVmFsdWUpO1xyXG5cdH0pO1xyXG5cdHNjb3BlLnBhcmVudHMuZm9yRWFjaChmdW5jdGlvbihwYXJlbnROb2RlKXtcclxuXHRcdHBhcmVudE5vZGUuZGF0YS5nYXBzLmZvckVhY2goZnVuY3Rpb24ocGFyZW50R2FwKXtcclxuXHRcdFx0aWYgKHBhcmVudEdhcC50eXBlID09PSBcImZnXCIpe1xyXG5cdFx0XHRcdHZhciBzdWJQYXRoID0gc2NvcGVQYXRoLnNsaWNlKHBhcmVudEdhcC5zY29wZVBhdGgubGVuZ3RoKTtcclxuXHRcdFx0XHQvL3ZhciBzdWJWYWwgPSB1dGlscy5vYmpQYXRoKHN1YlBhdGgsIHNlbGYuZGF0YSk7XHJcblx0XHRcdFx0cGFyZW50R2FwLmZnLnVwZGF0ZShzdWJQYXRoLCBuZXdWYWx1ZSk7XHJcblx0XHRcdH07XHRcdFx0XHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHRzY29wZS5zdWJzLmZvckVhY2goZnVuY3Rpb24oc3ViKXtcclxuXHRcdHZhciBzdWJWYWwgPSB1dGlscy5vYmpQYXRoKHN1Yi5wYXRoLCBzZWxmLmRhdGEpO1x0XHJcblx0XHR2YXIgc3ViUGF0aCA9IHN1Yi5wYXRoLnNsaWNlKHNjb3BlUGF0aC5sZW5ndGgpO1xyXG5cdFx0dmFyIG9sZFN1YlZhbCA9IHV0aWxzLm9ialBhdGgoc3ViUGF0aCwgb2xkVmFsdWUpO1xyXG5cdFx0aWYgKHN1YlZhbCA9PT0gb2xkU3ViVmFsKXtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fTtcclxuXHRcdHN1Yi5nYXBzLmZvckVhY2goZnVuY3Rpb24oZ2FwKXtcclxuXHRcdFx0aWYgKHNlbGYuZ2FwU3RvcmFnZS5nYXBzLmluZGV4T2YoZ2FwKSA8IDApe1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fTtcclxuXHRcdFx0Z2FwQ2xhc3NNZ3IudXBkYXRlKHNlbGYsIGdhcCwgc3ViLnBhdGgsIHN1YlZhbCwgb2xkU3ViVmFsKTtcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlU2NvcGVIZWxwZXIoZmcsIG9iaiwgc2NvcGVQYXRoKXtcclxuXHR2YXIgaGVscGVyID0gQXJyYXkuaXNBcnJheShvYmopIFxyXG5cdFx0PyBbXSBcclxuXHRcdDoge307XHJcblx0dXRpbHMub2JqRm9yKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSl7XHJcblx0XHR2YXIgcHJvcFNjb3BlUGF0aCA9IHNjb3BlUGF0aC5jb25jYXQoW2tleV0pO1xyXG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGhlbHBlciwga2V5LCB7XHJcblx0XHRcdGdldDogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKXtcclxuXHRcdFx0XHRcdHJldHVybiBjcmVhdGVTY29wZUhlbHBlcihmZywgb2JqW2tleV0sIHByb3BTY29wZVBhdGgpO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0cmV0dXJuIG9ialtrZXldO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRzZXQ6IGZ1bmN0aW9uKHZhbCl7XHJcblx0XHRcdFx0ZmcudXBkYXRlKHByb3BTY29wZVBhdGgsIHZhbCk7XHRcdFx0XHRcclxuXHRcdFx0fVx0XHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHRyZXR1cm4gaGVscGVyO1xyXG59O1xyXG5cclxuRmdJbnN0YW5jZUJhc2UucHJvdG90eXBlLiRkID0gZnVuY3Rpb24oKXtcclxuXHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuJGRhdGEgPSBmdW5jdGlvbihuZXdEYXRhKXtcclxuXHRpZiAobmV3RGF0YSl7XHJcblx0XHQvLy4uLlxyXG5cdFx0cmV0dXJuO1xyXG5cdH07XHJcblx0dmFyIGhlbHBlciA9IGNyZWF0ZVNjb3BlSGVscGVyKHRoaXMsIHRoaXMuZGF0YSwgW10pO1xyXG5cdHJldHVybiBoZWxwZXI7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuY2xvbmVEYXRhID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gdXRpbHMuZGVlcENsb25lKHRoaXMuZGF0YSk7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpe1xyXG5cdHRoaXMuY2hpbGRGZ3MuZm9yRWFjaChmdW5jdGlvbihjaGlsZCl7XHJcblx0XHRjaGlsZC5yZW1vdmUodHJ1ZSk7XHJcblx0fSk7XHJcblx0dGhpcy5jb2RlID0gJyc7XHJcblx0dGhpcy5kYXRhID0gbnVsbDtcclxuXHR0aGlzLmdhcFN0b3JhZ2UgPSBudWxsO1xyXG5cdHRoaXMuY2hpbGRGZ3MgPSBbXTtcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbih2aXJ0dWFsKXtcclxuXHRpZiAoIXZpcnR1YWwpe1xyXG5cdFx0dmFyIGRvbSA9IHRoaXMuZ2V0RG9tKCk7XHJcblx0XHRkb20uZm9yRWFjaChmdW5jdGlvbihlbG0pe1xyXG5cdFx0XHRlbG0ucmVtb3ZlKCk7XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cdHRoaXMuY2xlYXIoKTtcclxuXHR2YXIgaW5zdGFuY2VJZCA9IHRoaXMuZmdDbGFzcy5pbnN0YW5jZXMuaW5kZXhPZih0aGlzKTtcdFxyXG5cdHRoaXMuZmdDbGFzcy5pbnN0YW5jZXMuc3BsaWNlKGluc3RhbmNlSWQsIDEpO1xyXG5cdGZnSW5zdGFuY2VUYWJsZVt0aGlzLmlkXSA9IG51bGw7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUucmVyZW5kZXIgPSBmdW5jdGlvbihkYXRhKXtcclxuXHR0aGlzLmNsZWFyKCk7XHJcblx0dGhpcy5nYXBTdG9yYWdlID0gbmV3IEdhcFN0b3JhZ2UodGhpcyk7XHJcblx0dmFyIGRvbSA9IHRoaXMuZ2V0RG9tKClbMF07XHJcblx0dGhpcy5jb2RlID0gdGhpcy5nZXRIdG1sKGRhdGEpO1xyXG5cdGRvbS5vdXRlckhUTUwgPSB0aGlzLmNvZGU7IC8vIGRvZXNudCB3b3JrIHdpdGggbXVsdGkgcm9vdFxyXG5cdHRoaXMuYXNzaWduKCk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuZ2V0RG9tID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gdGhpcy5tZXRhLmdldERvbSgpO1xyXG59O1xyXG5cclxuRmdJbnN0YW5jZUJhc2UucHJvdG90eXBlLmpxID0gZnVuY3Rpb24oKXtcclxuXHR2YXIgZG9tID0gdGhpcy5nZXREb20oKTtcclxuXHR2YXIgcmVzID0gaGVscGVyLmpxKGRvbSk7XHJcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApe1xyXG5cdFx0cmV0dXJuIHJlcztcclxuXHR9O1xyXG5cdHZhciBzZWxlY3RvciA9IGFyZ3VtZW50c1swXTtcclxuXHR2YXIgc2VsZlNlbGVjdGVkID0gcmVzXHJcblx0XHQucGFyZW50KClcclxuXHRcdC5maW5kKHNlbGVjdG9yKVxyXG5cdFx0LmZpbHRlcihmdW5jdGlvbihpZCwgZWxtKXtcclxuXHRcdFx0cmV0dXJuIGRvbS5pbmRleE9mKGVsbSkgPj0gMDtcclxuXHRcdH0pO1xyXG5cdHZhciBjaGlsZFNlbGVjdGVkID0gcmVzLmZpbmQoc2VsZWN0b3IpO1xyXG5cdHJldHVybiBzZWxmU2VsZWN0ZWQuYWRkKGNoaWxkU2VsZWN0ZWQpO1xyXG59O1xyXG5cclxuRmdJbnN0YW5jZUJhc2UucHJvdG90eXBlLmdhcCA9IGZ1bmN0aW9uKGlkKXtcclxuXHRyZXR1cm4gdGhpcy5nYXBzKGlkKVswXTtcclxufTtcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5nYXBzID0gZnVuY3Rpb24oaWQpe1xyXG5cdHZhciBnYXBzID0gdGhpcy5nYXBTdG9yYWdlLmJ5RWlkKGlkKTtcclxuXHRpZiAoZ2Fwcyl7XHJcblx0XHRyZXR1cm4gZ2FwcztcclxuXHR9O1x0XHJcbn07XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuZWxtID0gRmdJbnN0YW5jZUJhc2UucHJvdG90eXBlLmdhcDsgLy8gbGVnYWN5XHJcblxyXG5GZ0luc3RhbmNlQmFzZS5wcm90b3R5cGUuZWxtcyA9IEZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5nYXBzOyAvLyBsZWdhY3lcclxuXHJcbkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbihpZCl7XHJcblx0dmFyIGdhcCA9IHRoaXMuZ2FwKGlkKTtcclxuXHRpZiAoIWdhcCl7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9O1xyXG5cdHJldHVybiBnYXAuZmcgfHwgbnVsbDsgXHJcbn07XHJcblxyXG5cclxuZnVuY3Rpb24gZ2V0RmdCeUlpZChpaWQpe1xyXG5cdHJldHVybiBmZ0luc3RhbmNlVGFibGVbaWlkXTtcclxufTtcclxuXHJcbmV4cG9ydHMuZ2V0RmdCeUlpZCA9IGdldEZnQnlJaWQ7XHJcbmV4cG9ydHMuRmdJbnN0YW5jZSA9IEZnSW5zdGFuY2U7XHJcbmV4cG9ydHMuRmdJbnN0YW5jZUJhc2UgPSBGZ0luc3RhbmNlQmFzZTtcclxuZXhwb3J0cy5mZ0luc3RhbmNlVGFibGUgPSBmZ0luc3RhbmNlVGFibGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgZ2FwQ2xhc3NlcyA9IHt9O1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCdmZy1qcy91dGlscycpO1xyXG52YXIgdmFsdWVNZ3IgPSByZXF1aXJlKCdmZy1qcy92YWx1ZU1ncicpO1xyXG5cclxuZnVuY3Rpb24gcmVnR2FwKGdhcEhhbmRsZXIpe1x0XHJcblx0Z2FwQ2xhc3Nlc1tnYXBIYW5kbGVyLm5hbWVdID0gZ2FwSGFuZGxlcjtcclxuXHRyZXR1cm4gZ2FwSGFuZGxlcjtcclxufTtcclxuZXhwb3J0cy5yZWdHYXAgPSByZWdHYXA7XHJcblxyXG5mdW5jdGlvbiBHYXAoY29udGV4dCwgcGFyc2VkTWV0YSwgcGFyZW50KXtcdFxyXG5cdHV0aWxzLmV4dGVuZCh0aGlzLCBwYXJzZWRNZXRhKTsgLy8gdG9kbzogd2h5P1xyXG5cdHRoaXMuY2hpbGRyZW4gPSBbXTtcdFxyXG5cdHRoaXMucGFyZW50ID0gcGFyZW50IHx8IG51bGw7XHJcblx0dGhpcy5yb290ID0gdGhpcztcclxuXHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1x0XHJcblx0Ly90aGlzLnNjb3BlUGF0aCA9IHV0aWxzLmdldFNjb3BlUGF0aCh0aGlzKTtcclxuXHQvL3RoaXMudHJpZ2dlcnMgPSBbXTtcclxuXHRjb250ZXh0LmdhcFN0b3JhZ2UucmVnKHRoaXMpO1xyXG5cdGlmICh0aGlzLnBhdGgpe1xyXG5cdFx0dGhpcy5yZXNvbHZlZFBhdGggPSB2YWx1ZU1nci5yZXNvbHZlUGF0aCh0aGlzLCB0aGlzLnBhdGgpOyBcclxuXHRcdGlmICh0aGlzLnJlc29sdmVkUGF0aC5zb3VyY2UgPT09IFwiZGF0YVwiKXtcclxuXHRcdFx0Y29udGV4dC5nYXBTdG9yYWdlLnNldFRyaWdnZXJzKHRoaXMsIFt0aGlzLnJlc29sdmVkUGF0aC5wYXRoXSk7XHJcblx0XHR9O1x0XHJcblx0fTtcclxuXHRpZiAoIXBhcmVudCl7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9O1xyXG5cdHRoaXMucm9vdCA9IHBhcmVudC5yb290O1xyXG5cdHBhcmVudC5jaGlsZHJlbi5wdXNoKHRoaXMpO1xyXG59O1xyXG5cclxuR2FwLnByb3RvdHlwZS5jbG9zZXN0ID0gZnVuY3Rpb24oc2VsZWN0b3Ipe1xyXG5cdHZhciBlaWQgPSBzZWxlY3Rvci5zbGljZSgxKTtcclxuXHR2YXIgZ2FwID0gdGhpcy5wYXJlbnQ7XHJcblx0d2hpbGUgKGdhcCl7XHJcblx0XHRpZiAoZ2FwLmVpZCA9PT0gZWlkKXtcclxuXHRcdFx0cmV0dXJuIGdhcDtcclxuXHRcdH07XHJcblx0XHRnYXAgPSBnYXAucGFyZW50O1xyXG5cdH07XHJcblx0cmV0dXJuIG51bGw7XHJcbn07XHJcblxyXG5HYXAucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbih2YWwpe1xyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKXtcclxuXHRcdHJldHVybiB1dGlscy5vYmpQYXRoKHRoaXMuc2NvcGVQYXRoLCB0aGlzLmNvbnRleHQuZGF0YSk7XHJcblx0fTtcclxuXHR0aGlzLmNvbnRleHQudXBkYXRlKHRoaXMuc2NvcGVQYXRoLCB2YWwpO1x0XHJcbn07XHJcblxyXG5HYXAucHJvdG90eXBlLmZpbmRSZWFsRG93biA9IGZ1bmN0aW9uKCl7XHJcblx0aWYgKCF0aGlzLmlzVmlydHVhbCl7XHJcblx0XHRyZXR1cm4gW3RoaXNdO1xyXG5cdH07XHJcblx0dmFyIHJlcyA9IFtdO1xyXG5cdHRoaXMuY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uKGNoaWxkKXtcclxuXHRcdHJlcyA9IHJlcy5jb25jYXQoY2hpbGQuZmluZFJlYWxEb3duKCkpO1xyXG5cdH0pO1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG5HYXAucHJvdG90eXBlLmdldERvbSA9IGZ1bmN0aW9uKCl7XHJcblx0aWYgKCF0aGlzLmlzVmlydHVhbCl7XHJcblx0XHR2YXIgaWQgPSBbXCJmZ1wiLCB0aGlzLmNvbnRleHQuaWQsIFwiZ2lkXCIsIHRoaXMuZ2lkXS5qb2luKCctJyk7XHJcblx0XHRyZXR1cm4gW2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKV07XHJcblx0fTtcclxuXHR2YXIgcmVzID0gW107XHJcblx0dGhpcy5maW5kUmVhbERvd24oKS5mb3JFYWNoKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRyZXMgPSByZXMuY29uY2F0KGdhcC5nZXREb20oKSk7XHJcblx0fSk7XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbkdhcC5wcm90b3R5cGUucmVtb3ZlRG9tID0gZnVuY3Rpb24oKXtcclxuXHR2YXIgZG9tID0gdGhpcy5nZXREb20oKTtcclxuXHRkb20uZm9yRWFjaChmdW5jdGlvbihlbG0pe1xyXG5cdFx0aWYgKCFlbG0pe1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9O1xyXG5cdFx0ZWxtLnJlbW92ZSgpO1xyXG5cdH0pO1xyXG59O1xyXG5cclxuZXhwb3J0cy5HYXAgPSBHYXA7XHJcblxyXG5mdW5jdGlvbiByZW5kZXIoY29udGV4dCwgcGFyZW50LCBkYXRhLCBtZXRhKXtcclxuXHR2YXIgZ2FwID0gbmV3IEdhcChjb250ZXh0LCBtZXRhLCBwYXJlbnQpO1xyXG5cdHZhciBnYXBDbGFzcyA9IGdhcENsYXNzZXNbbWV0YS50eXBlXTtcclxuXHRyZXR1cm4gZ2FwQ2xhc3MucmVuZGVyLmNhbGwoZ2FwLCBjb250ZXh0LCBkYXRhKTtcclxufTtcclxuXHJcbmV4cG9ydHMucmVuZGVyID0gcmVuZGVyO1xyXG5cclxuZnVuY3Rpb24gdXBkYXRlKGNvbnRleHQsIGdhcE1ldGEsIHNjb3BlUGF0aCwgdmFsdWUsIG9sZFZhbHVlKXtcclxuXHR2YXIgZ2FwQ2xhc3MgPSBnYXBDbGFzc2VzW2dhcE1ldGEudHlwZV07XHJcblx0aWYgKCFnYXBDbGFzcyl7XHJcblx0XHRyZXR1cm47XHJcblx0fTtcclxuXHRyZXR1cm4gZ2FwQ2xhc3MudXBkYXRlKGNvbnRleHQsIGdhcE1ldGEsIHNjb3BlUGF0aCwgdmFsdWUsIG9sZFZhbHVlKTtcclxufTtcclxuXHJcbmV4cG9ydHMudXBkYXRlID0gdXBkYXRlOyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMuanMnKTtcclxudmFyIFRyZWVIZWxwZXIgPSByZXF1aXJlKCdmZy1qcy91dGlscy90cmVlSGVscGVyLmpzJyk7XHJcblxyXG5mdW5jdGlvbiBpbml0Tm9kZUZuKCl7XHJcblx0cmV0dXJuIHtcclxuXHRcdGdhcHM6IFtdXHJcblx0fTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIEdhcFN0b3JhZ2UoY29udGV4dCl7XHJcblx0dGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuXHR0aGlzLmdhcHMgPSBbXTtcclxuXHR0aGlzLnNjb3BlVHJlZSA9IG5ldyBUcmVlSGVscGVyKHtcclxuXHRcdGtpbmQ6ICdkaWN0JyxcclxuXHRcdGluaXROb2RlOiBpbml0Tm9kZUZuXHJcblx0fSk7XHJcblx0dGhpcy5laWREaWN0ID0ge307XHRcclxufTtcclxuXHJcbkdhcFN0b3JhZ2UucHJvdG90eXBlLnNldFNjb3BlVHJpZ2dlciA9IGZ1bmN0aW9uKGdhcCwgc2NvcGVQYXRoKXtcclxuXHR2YXIgc2NvcGUgPSB0aGlzLnNjb3BlVHJlZS5hY2Nlc3Moc2NvcGVQYXRoKTtcdFxyXG5cdHNjb3BlLmRhdGEuZ2Fwcy5wdXNoKGdhcCk7XHJcbn07XHJcblxyXG4vKkdhcFN0b3JhZ2UucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG1ldGEsIHNjb3BlVHJpZ2dlcnMsIGdpZCl7XHJcblx0c2NvcGVUcmlnZ2VycyA9IHNjb3BlVHJpZ2dlcnMgfHwgW21ldGEuc2NvcGVQYXRoXTtcclxuXHR2YXIgZ2FwID0ge1xyXG5cdFx0XCJpZFwiOiBnaWQgfHwgdGhpcy5nZXRHaWQoKSxcclxuXHRcdFwibWV0YVwiOiBtZXRhXHJcblx0fTtcclxuXHRzY29wZVRyaWdnZXJzLmZvckVhY2godGhpcy5zZXRTY29wZVRyaWdnZXIuYmluZCh0aGlzLCBnYXApKTtcclxuXHR0aGlzLmdhcHMucHVzaChnYXApO1xyXG59O1xyXG5cclxuR2FwU3RvcmFnZS5wcm90b3R5cGUuc2V0QXR0cnMgPSBmdW5jdGlvbihtZXRhLCBhdHRycywgZ2lkKXtcclxuXHR2YXIgZmdHYXBDbGFzcyA9ICdmZy1nYXAtJyArIHRoaXMuY29udGV4dC5pZDtcclxuXHRhdHRycy5jbGFzcyA9IGF0dHJzLmNsYXNzIFxyXG5cdFx0PyBmZ0dhcENsYXNzICsgJyAnICsgYXR0cnMuY2xhc3NcclxuXHRcdDogZmdHYXBDbGFzcztcclxuXHRhdHRyc1tcImRhdGEtZmctXCIgKyB0aGlzLmNvbnRleHQuaWQgKyBcIi1nYXAtaWRcIl0gPSBnaWQ7XHJcblx0Ly9hdHRycy5pZCA9IFtcImZnXCIsIHRoaXMuY29udGV4dC5pZCwgXCJnYXAtaWRcIiwgZ2lkXS5qb2luKCctJyk7XHJcbiBcdHJldHVybiBhdHRycztcclxufTsqL1xyXG5cclxuR2FwU3RvcmFnZS5wcm90b3R5cGUuc2V0VHJpZ2dlcnMgPSBmdW5jdGlvbihnYXBNZXRhLCBzY29wZVRyaWdnZXJzKXtcdFxyXG5cdHNjb3BlVHJpZ2dlcnMuZm9yRWFjaCh0aGlzLnNldFNjb3BlVHJpZ2dlci5iaW5kKHRoaXMsIGdhcE1ldGEpKTtcclxufTtcclxuXHJcbkdhcFN0b3JhZ2UucHJvdG90eXBlLnJlZyA9IGZ1bmN0aW9uKGdhcE1ldGEpe1xyXG5cdHZhciBlaWQgPSBnYXBNZXRhLmVpZDtcclxuXHRpZiAoZWlkKXtcdFx0XHJcblx0XHR0aGlzLmVpZERpY3RbZWlkXSA9IHRoaXMuZWlkRGljdFtlaWRdIHx8IFtdO1xyXG5cdFx0dGhpcy5laWREaWN0W2VpZF0ucHVzaChnYXBNZXRhKTtcclxuXHR9O1xyXG5cdHZhciBnaWQgPSB0aGlzLmdldEdpZCgpO1xyXG5cdGdhcE1ldGEuZ2lkID0gZ2lkO1xyXG5cdGlmICghZ2FwTWV0YS5pc1ZpcnR1YWwpe1xyXG5cdFx0Z2FwTWV0YS5hdHRycyA9IHV0aWxzLnNpbXBsZUNsb25lKGdhcE1ldGEuYXR0cnMgfHwge30pO1x0XHRcclxuXHRcdGdhcE1ldGEuYXR0cnMuaWQgPSBbXCJmZ1wiLCB0aGlzLmNvbnRleHQuaWQsIFwiZ2lkXCIsIGdpZF0uam9pbignLScpO1xyXG5cdH07XHJcblx0Z2FwTWV0YS5zdG9yYWdlSWQgPSB0aGlzLmdhcHMubGVuZ3RoO1xyXG5cdHRoaXMuZ2Fwcy5wdXNoKGdhcE1ldGEpO1x0XHRcclxuXHQvL3JldHVybiBhdHRyc09iajtcclxufTtcclxuXHJcbkdhcFN0b3JhZ2UucHJvdG90eXBlLmFzc2lnbiA9IGZ1bmN0aW9uKCl7XHJcblx0Ly9pZiAoKVxyXG5cdHRoaXMuZ2Fwcy5mb3JFYWNoKGZ1bmN0aW9uKGdhcE1ldGEpe1xyXG5cdFx0aWYgKGdhcE1ldGEudHlwZSAhPT0gXCJyb290XCIgJiYgZ2FwTWV0YS5mZyl7XHJcblx0XHRcdGdhcE1ldGEuZmcuYXNzaWduKCk7XHJcblx0XHR9O1xyXG5cdH0pO1xyXG5cdHJldHVybjtcclxuXHQvLyB2YXIgc2VsZiA9IHRoaXM7XHJcblx0Ly8gdmFyIGdhcE5vZGVzID0gdGhpcy5jb250ZXh0LmRvbS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdmZy1nYXAtJyArIHRoaXMuY29udGV4dC5pZCk7XHJcblx0Ly8gZm9yICh2YXIgaSA9IDA7IGkgPCBnYXBOb2Rlcy5sZW5ndGg7IGkrKyl7XHJcblx0Ly8gXHR2YXIgZ2FwTm9kZSA9IGdhcE5vZGVzW2ldO1xyXG5cdC8vIFx0dmFyIGdpZCA9IGdhcE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWZnLScgKyB0aGlzLmNvbnRleHQuaWQgKyAnLWdhcC1pZCcpO1xyXG5cdC8vIFx0dmFyIGdhcCA9IHNlbGYuZ2Fwc1tnaWRdO1xyXG5cdC8vIFx0aWYgKCFnYXApe2NvbnRpbnVlfTtcclxuXHQvLyBcdGlmIChnYXAubWV0YS5mZyl7XHJcblx0Ly8gXHRcdGdhcC5tZXRhLmZnLmFzc2lnbigpO1xyXG5cdC8vIFx0fTtcclxuXHQvLyBcdGdhcC5tZXRhLmRvbSA9IGdhcE5vZGU7XHJcblx0Ly8gfTtcclxufTtcclxuXHJcbi8qR2FwU3RvcmFnZS5wcm90b3R5cGUuc3ViVHJlZSA9IGZ1bmN0aW9uKHNjb3BlUGF0aCl7XHJcblx0dmFyIGJyYW5jaCA9IGFjY2Vzc1Njb3BlTGVhZih0aGlzLnNjb3BlVHJlZSwgc2NvcGVQYXRoKTtcclxuXHR2YXIgcmVzID0gW107XHJcblxyXG5cdGZ1bmN0aW9uIGl0ZXJhdGUobm9kZSl7XHJcblx0XHRmb3IgKHZhciBpIGluIG5vZGUuY2hpbGRyZW4pe1xyXG5cclxuXHRcdH07XHJcblx0fTtcclxuXHJcblxyXG59OyovXHJcblxyXG5HYXBTdG9yYWdlLnByb3RvdHlwZS5ieVNjb3BlID0gZnVuY3Rpb24oc2NvcGVQYXRoLCB0YXJnZXRPbmx5KXtcclxuXHR2YXIgc2NvcGUgPSB0aGlzLnNjb3BlVHJlZS5hY2Nlc3Moc2NvcGVQYXRoKTtcdFx0XHJcblx0dmFyIHN1Yk5vZGVzID0gW107XHJcblx0aWYgKHNjb3BlLmNoaWxkQ291bnQgIT09IDAgJiYgIXRhcmdldE9ubHkpe1xyXG5cdFx0c3ViTm9kZXMgPSBzY29wZS5nZXREZWVwQ2hpbGRBcnIoKS5tYXAoZnVuY3Rpb24obm9kZSl7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0Z2Fwczogbm9kZS5kYXRhLmdhcHMsXHJcblx0XHRcdFx0cGF0aDogbm9kZS5wYXRoXHRcclxuXHRcdFx0fTtcdFx0XHRcclxuXHRcdH0pO1xyXG5cdH07XHJcblx0dmFyIHBhcmVudHMgPSBzY29wZS5nZXRQYXJlbnRzKCk7XHJcblx0cmV0dXJuIHtcclxuXHRcdHRhcmdldDogc2NvcGUuZGF0YS5nYXBzLFxyXG5cdFx0c3Viczogc3ViTm9kZXMsXHJcblx0XHRwYXJlbnRzOiBwYXJlbnRzXHJcblx0fTtcclxufTtcclxuXHJcbkdhcFN0b3JhZ2UucHJvdG90eXBlLnJlbW92ZVNjb3BlID0gZnVuY3Rpb24oc2NvcGVQYXRoKXtcclxuXHR2YXIgc2NvcGUgPSB0aGlzLmJ5U2NvcGUoc2NvcGVQYXRoKTtcdFxyXG5cdHZhciByZW1vdmVkRG9tR2FwcyA9IHNjb3BlLnRhcmdldDtcclxuXHR2YXIgcmVtb3ZlZEdhcHMgPSBzY29wZS50YXJnZXQ7XHJcblx0c2NvcGUuc3Vicy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpe1xyXG5cdFx0cmVtb3ZlZEdhcHMgPSByZW1vdmVkR2Fwcy5jb25jYXQobm9kZS5nYXBzKTtcclxuXHR9KTtcclxuXHR0aGlzLnNjb3BlVHJlZS5yZW1vdmUoc2NvcGVQYXRoKTtcclxuXHR0aGlzLmdhcHMgPSB0aGlzLmdhcHMuZmlsdGVyKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRyZXR1cm4gcmVtb3ZlZEdhcHMuaW5kZXhPZihnYXApIDwgMDtcclxuXHR9KTtcclxuXHRyZW1vdmVkRG9tR2Fwcy5mb3JFYWNoKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRnYXAucmVtb3ZlRG9tKCk7XHJcblx0fSk7XHJcbn07XHJcblxyXG5HYXBTdG9yYWdlLnByb3RvdHlwZS5ieUVpZCA9IGZ1bmN0aW9uKGVpZCl7XHJcblx0cmV0dXJuIHRoaXMuZWlkRGljdFtlaWRdO1xyXG59O1xyXG5cclxuR2FwU3RvcmFnZS5wcm90b3R5cGUuZ2V0R2lkID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gdGhpcy5nYXBzLmxlbmd0aDtcclxufTtcclxuXHJcbmV4cG9ydHMuR2FwU3RvcmFnZSA9IEdhcFN0b3JhZ2U7XHJcbiIsInZhciBnYXBDbGFzc01nciA9IHJlcXVpcmUoJ2ZnLWpzL2NsaWVudC9nYXBDbGFzc01nci5qcycpO1xuZ2FwQ2xhc3NNZ3IucmVnR2FwKHtcblx0XCJuYW1lXCI6IFwiY29udGVudFwiLFxuXHRcInBhdGhcIjogXCIuLi9nYXBzL2NvbnRlbnRcIixcblx0XCJyZW5kZXJcIjogcmVxdWlyZShcIi4uL2dhcHMvY29udGVudC9yZW5kZXIuanNcIiksXG5cdFwidXBkYXRlXCI6IHJlcXVpcmUoXCIuLi9nYXBzL2NvbnRlbnQvdXBkYXRlLmpzXCIpLFxufSk7XG5nYXBDbGFzc01nci5yZWdHYXAoe1xuXHRcIm5hbWVcIjogXCJkYXRhXCIsXG5cdFwicGF0aFwiOiBcIi4uL2dhcHMvZGF0YVwiLFxuXHRcInJlbmRlclwiOiByZXF1aXJlKFwiLi4vZ2Fwcy9kYXRhL3JlbmRlci5qc1wiKSxcblx0XCJ1cGRhdGVcIjogcmVxdWlyZShcIi4uL2dhcHMvZGF0YS91cGRhdGUuanNcIiksXG59KTtcbmdhcENsYXNzTWdyLnJlZ0dhcCh7XG5cdFwibmFtZVwiOiBcImZnXCIsXG5cdFwicGF0aFwiOiBcIi4uL2dhcHMvZmdcIixcblx0XCJyZW5kZXJcIjogcmVxdWlyZShcIi4uL2dhcHMvZmcvcmVuZGVyLmpzXCIpLFxuXHRcInVwZGF0ZVwiOiByZXF1aXJlKFwiLi4vZ2Fwcy9mZy91cGRhdGUuanNcIiksXG59KTtcbmdhcENsYXNzTWdyLnJlZ0dhcCh7XG5cdFwibmFtZVwiOiBcInJhd1wiLFxuXHRcInBhdGhcIjogXCIuLi9nYXBzL3Jhd1wiLFxuXHRcInJlbmRlclwiOiByZXF1aXJlKFwiLi4vZ2Fwcy9yYXcvcmVuZGVyLmpzXCIpLFxuXHRcInVwZGF0ZVwiOiByZXF1aXJlKFwiLi4vZ2Fwcy9yYXcvdXBkYXRlLmpzXCIpLFxufSk7XG5nYXBDbGFzc01nci5yZWdHYXAoe1xuXHRcIm5hbWVcIjogXCJzY29wZVwiLFxuXHRcInBhdGhcIjogXCIuLi9nYXBzL3Njb3BlXCIsXG5cdFwicmVuZGVyXCI6IHJlcXVpcmUoXCIuLi9nYXBzL3Njb3BlL3JlbmRlci5qc1wiKSxcblx0XCJ1cGRhdGVcIjogcmVxdWlyZShcIi4uL2dhcHMvc2NvcGUvdXBkYXRlLmpzXCIpLFxufSk7XG5nYXBDbGFzc01nci5yZWdHYXAoe1xuXHRcIm5hbWVcIjogXCJzY29wZS1pdGVtXCIsXG5cdFwicGF0aFwiOiBcIi4uL2dhcHMvc2NvcGUtaXRlbVwiLFxuXHRcInJlbmRlclwiOiByZXF1aXJlKFwiLi4vZ2Fwcy9zY29wZS1pdGVtL3JlbmRlci5qc1wiKSxcblx0XCJ1cGRhdGVcIjogcmVxdWlyZShcIi4uL2dhcHMvc2NvcGUtaXRlbS91cGRhdGUuanNcIiksXG59KTsiLCJ2YXIgZXZlbnRzID0ge307XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVyKG5hbWUsIGV2ZW50KXtcclxuXHR2YXIgZWxtID0gZXZlbnQudGFyZ2V0O1xyXG5cdHdoaWxlIChlbG0pe1xyXG5cdFx0dmFyIGZnID0gJGZnLmJ5RG9tKGVsbSk7XHJcblx0XHRpZiAoZmcpe1xyXG5cdFx0XHRmZy5lbWl0QXBwbHkobmFtZSwgZmcsIFtldmVudF0pO1xyXG5cdFx0XHQvL3JldHVybjtcclxuXHRcdH07XHJcblx0XHRlbG0gPSBlbG0ucGFyZW50Tm9kZTtcclxuXHR9O1xyXG59O1xyXG5cclxuZXhwb3J0cy5saXN0ZW4gPSBmdW5jdGlvbihuYW1lKXtcclxuXHRpZiAobmFtZSBpbiBldmVudHMpe1xyXG5cdFx0cmV0dXJuO1xyXG5cdH07XHRcclxuXHRldmVudHNbbmFtZV0gPSB0cnVlO1xyXG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgaGFuZGxlci5iaW5kKG51bGwsIG5hbWUpLCB7XCJjYXB0dXJlXCI6IHRydWV9KTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9ICRmZztcclxuXHJcbnZhciBmZ0NsYXNzTW9kdWxlID0gcmVxdWlyZSgnZmctanMvY2xpZW50L2ZnQ2xhc3MuanMnKTtcclxudmFyIGZnSW5zdGFuY2VNb2R1bGUgPSByZXF1aXJlKCdmZy1qcy9jbGllbnQvZmdJbnN0YW5jZS5qcycpO1xyXG5cclxuZnVuY3Rpb24gJGZnKGFyZyl7XHJcblx0aWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KXtcclxuXHRcdHJldHVybiAkZmcuYnlEb20oYXJnKTtcclxuXHR9O1xyXG5cdGlmICh0eXBlb2YgYXJnID09IFwic3RyaW5nXCIpe1xyXG5cdFx0cmV0dXJuIGZnQ2xhc3NNb2R1bGUuZmdDbGFzc0RpY3RbYXJnXTtcclxuXHR9O1xyXG59O1xyXG5cclxuJGZnLmxvYWQgPSBmdW5jdGlvbihmZ0RhdGEpe1xyXG5cdGlmIChBcnJheS5pc0FycmF5KGZnRGF0YSkpe1x0XHRcclxuXHRcdHJldHVybiBmZ0RhdGEubWFwKCRmZy5sb2FkKTtcclxuXHR9O1xyXG5cdHJldHVybiBuZXcgZmdDbGFzc01vZHVsZS5GZ0NsYXNzKGZnRGF0YSk7XHJcbn07XHJcblxyXG4kZmcuaXNGZyA9IGZ1bmN0aW9uKGRvbU5vZGUpe1xyXG5cdHJldHVybiBkb21Ob2RlLmNsYXNzTGlzdCAmJiBkb21Ob2RlLmNsYXNzTGlzdC5jb250YWlucygnZmcnKTtcclxufTtcclxuXHJcbnZhciBpaWRSZSA9IC9mZ1xcLWlpZFxcLShcXGQrKS9nO1xyXG52YXIgaWRSZSA9IC9mZ1xcLShcXGQrKVxcLWdpZFxcLShcXGQrKS9nO1xyXG5cclxuJGZnLmJ5RG9tID0gZnVuY3Rpb24oZG9tTm9kZSl7XHRcclxuXHRpZiAoIWRvbU5vZGUgfHwgIWRvbU5vZGUuY2xhc3NOYW1lKXtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH07XHJcblx0aWYgKCF+ZG9tTm9kZS5jbGFzc05hbWUuc3BsaXQoJyAnKS5pbmRleE9mKCdmZycpKXtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH07XHJcblx0aWYgKCFkb21Ob2RlLmlkKXtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH07XHJcblx0aWRSZS5sYXN0SW5kZXggPSAwO1xyXG5cdHZhciByZXMgPSBpZFJlLmV4ZWMoZG9tTm9kZS5pZCk7XHJcblx0aWYgKCFyZXMpe1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fTtcclxuXHR2YXIgaWlkID0gcGFyc2VJbnQocmVzWzFdKTtcclxuXHRyZXR1cm4gZmdJbnN0YW5jZU1vZHVsZS5nZXRGZ0J5SWlkKGlpZCk7XHRcclxufTtcclxuXHJcbiRmZy5nYXBDbG9zZXN0ID0gZnVuY3Rpb24oZG9tTm9kZSl7XHJcblx0d2hpbGUgKHRydWUpe1xyXG5cdFx0aWRSZS5sYXN0SW5kZXggPSAwO1xyXG5cdFx0dmFyIHJlcyA9IGlkUmUuZXhlYyhkb21Ob2RlLmlkKTtcclxuXHRcdGlmICghcmVzKXtcclxuXHRcdFx0ZG9tTm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZTtcclxuXHRcdFx0aWYgKCFkb21Ob2RlKXtcclxuXHRcdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdFx0fTtcclxuXHRcdFx0Y29udGludWU7XHJcblx0XHR9O1xyXG5cdFx0dmFyIGlpZCA9IHBhcnNlSW50KHJlc1sxXSk7XHJcblx0XHR2YXIgZmcgPSBmZ0luc3RhbmNlTW9kdWxlLmdldEZnQnlJaWQoaWlkKTtcclxuXHRcdHZhciBnaWQgPSBwYXJzZUludChyZXNbMl0pO1xyXG5cdFx0cmV0dXJuIGZnLmdhcFN0b3JhZ2UuZ2Fwc1tnaWRdO1xyXG5cdH07XHJcbn07XHJcblxyXG4kZmcuY2xhc3NlcyA9IGZnQ2xhc3NNb2R1bGUuZmdDbGFzc0RpY3Q7XHJcblxyXG4kZmcuZmdzID0gZmdJbnN0YW5jZU1vZHVsZS5mZ0luc3RhbmNlVGFibGU7XHJcblxyXG4kZmcuanEgPSB3aW5kb3cualF1ZXJ5O1xyXG5cclxud2luZG93LiRmZyA9ICRmZzsiLCJyZXF1aXJlKCcuL2dhcHMuanMnKTtcclxudmFyIGZnSGVscGVyID0gcmVxdWlyZSgnLi9oZWxwZXIuanMnKTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcihwYXJlbnQpe1xyXG5cdHRoaXMuZXZlbnRzID0ge307XHJcblx0dGhpcy5wYXJlbnQgPSBwYXJlbnQ7XHJcbn07XHJcblxyXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24obmFtZSwgZm4pe1xyXG5cdHZhciBldmVudExpc3QgPSB0aGlzLmV2ZW50c1tuYW1lXTtcclxuXHRpZiAoIWV2ZW50TGlzdCl7XHJcblx0XHRldmVudExpc3QgPSBbXTtcclxuXHRcdHRoaXMuZXZlbnRzW25hbWVdID0gZXZlbnRMaXN0O1xyXG5cdH07XHJcblx0ZXZlbnRMaXN0LnB1c2goZm4pO1xyXG59O1xyXG5cclxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24obmFtZS8qLCByZXN0Ki8pe1xyXG5cdGlmICh0aGlzLnBhcmVudCl7XHJcblx0XHR0aGlzLnBhcmVudC5lbWl0LmFwcGx5KHRoaXMucGFyZW50LCBhcmd1bWVudHMpO1xyXG5cdH07XHJcblx0dmFyIGV2ZW50TGlzdCA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG5cdGlmICghZXZlbnRMaXN0KXtcclxuXHRcdHJldHVybjtcclxuXHR9O1xyXG5cdHZhciBlbWl0QXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcdCBcclxuXHRldmVudExpc3QuZm9yRWFjaChmdW5jdGlvbihmbil7XHJcblx0XHRmbi5hcHBseSh0aGlzLCBlbWl0QXJncyk7XHJcblx0fSk7XHJcbn07XHJcblxyXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXRBcHBseSA9IGZ1bmN0aW9uKG5hbWUsIHRoaXNBcmcsIGFyZ3Mpe1xyXG5cdGlmICh0aGlzLnBhcmVudCl7XHJcblx0XHR0aGlzLnBhcmVudC5lbWl0QXBwbHkuYXBwbHkodGhpcy5wYXJlbnQsIGFyZ3VtZW50cyk7XHJcblx0fTtcclxuXHR2YXIgZXZlbnRMaXN0ID0gdGhpcy5ldmVudHNbbmFtZV07XHJcblx0aWYgKCFldmVudExpc3Qpe1xyXG5cdFx0cmV0dXJuO1xyXG5cdH07XHJcblx0ZXZlbnRMaXN0LmZvckVhY2goZnVuY3Rpb24oZm4pe1xyXG5cdFx0Zm4uYXBwbHkodGhpc0FyZywgYXJncyk7XHJcblx0fSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjsiLCJmdW5jdGlvbiByZW5kZXIoY29udGV4dCwgZGF0YSl7XHJcblx0dGhpcy5zY29wZVBhdGggPSBjb250ZXh0LmdhcE1ldGEuc2NvcGVQYXRoO1xyXG5cdHJldHVybiBjb250ZXh0LnBhcmVudC5yZW5kZXJUcGwoY29udGV4dC5tZXRhLmNvbnRlbnQsIGNvbnRleHQuZ2FwTWV0YS5wYXJlbnQsIGNvbnRleHQucGFyZW50LmRhdGEpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXI7IiwiZnVuY3Rpb24gdXBkYXRlKGNvbnRleHQsIG1ldGEsIHNjb3BlUGF0aCwgdmFsdWUpe1xyXG5cdHJldHVybjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdXBkYXRlOyIsInZhciB2YWx1ZU1nciA9IHJlcXVpcmUoJ2ZnLWpzL3ZhbHVlTWdyJyk7XHJcbnZhciB1dGlscyA9IHJlcXVpcmUoJ2ZnLWpzL3V0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiByZW5kZXIoY29udGV4dCwgZGF0YSl7XHJcblx0dmFyIHZhbHVlID0gdmFsdWVNZ3IucmVuZGVyKHRoaXMsIGRhdGEsIHRoaXMucmVzb2x2ZWRQYXRoKTtcclxuXHRyZXR1cm4gdXRpbHMucmVuZGVyVGFnKHtcclxuXHRcdG5hbWU6IFwic3BhblwiLFxyXG5cdFx0YXR0cnM6IHRoaXMuYXR0cnMsXHJcblx0XHRpbm5lckhUTUw6IHZhbHVlXHJcblx0fSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlbmRlcjsiLCJmdW5jdGlvbiB1cGRhdGUoY29udGV4dCwgbWV0YSwgc2NvcGVQYXRoLCB2YWx1ZSl7XHJcblx0dmFyIG5vZGUgPSBtZXRhLmdldERvbSgpWzBdO1xyXG5cdGlmICghbm9kZSl7XHJcblx0XHRcclxuXHR9O1xyXG5cdG5vZGUuaW5uZXJIVE1MID0gdmFsdWU7XHJcblx0Ly9oaWdobGlnaHQobm9kZSwgWzB4ZmZmZmZmLCAweGZmZWU4OF0sIDUwMCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHVwZGF0ZTsiLCJ2YXIgdmFsdWVNZ3IgPSByZXF1aXJlKCdmZy1qcy92YWx1ZU1nci5qcycpO1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCdmZy1qcy91dGlscycpO1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyKGNvbnRleHQsIGRhdGEpe1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHR0aGlzLnBhcmVudEZnID0gY29udGV4dDtcclxuXHQvL3RoaXMucmVuZGVyZWRDb250ZW50ID0gY29udGV4dC5yZW5kZXJUcGwodGhpcy5jb250ZW50LCBtZXRhLCBkYXRhKTtcclxuXHR2YXIgZmdDbGFzcyA9ICRmZy5jbGFzc2VzW3RoaXMuZmdOYW1lXTtcclxuXHR2YXIgZmdEYXRhID0gdXRpbHMuZGVlcENsb25lKHZhbHVlTWdyLmdldFZhbHVlKHRoaXMsIGRhdGEsIHRoaXMucmVzb2x2ZWRQYXRoKSk7XHRcclxuXHR2YXIgZmcgPSBmZ0NsYXNzLnJlbmRlcihmZ0RhdGEsIHRoaXMsIGNvbnRleHQpO1xyXG5cdGZnLm9uKCd1cGRhdGUnLCBmdW5jdGlvbihwYXRoLCB2YWwpe1xyXG5cdFx0Y29udGV4dC51cGRhdGUoc2NvcGVQYXRoLmNvbmNhdChwYXRoKSwgdmFsKTtcclxuXHRcdC8vY29uc29sZS5sb2cocGF0aCwgdmFsKTtcclxuXHR9KTtcclxuXHR0aGlzLmZnID0gZmc7XHJcblx0ZmcubWV0YSA9IHRoaXM7XHJcblx0Y29udGV4dC5jaGlsZEZncy5wdXNoKGZnKTtcclxuXHRyZXR1cm4gZmc7XHJcblx0aWYgKHRydWUpeyAvLyBjbGllbnRcclxuXHRcdFxyXG5cdH07XHRcdFxyXG5cdHRocm93ICd0b2RvIHNlcnZlciByZW5kZXInO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXI7IiwidmFyIHV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMnKTtcclxudmFyIHZhbHVlTWdyID0gcmVxdWlyZSgnZmctanMvdmFsdWVNZ3InKTtcclxudmFyIFN0clRwbCA9IHJlcXVpcmUoJ2ZnLWpzL3N0clRwbC5qcycpO1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyKGNvbnRleHQsIGRhdGEpe1xyXG5cdHZhciBtZXRhID0gdGhpcztcclxuXHRpZiAobWV0YS5pc1Njb3BlSG9sZGVyKXtcclxuXHRcdG1ldGEucm9vdC5jdXJyZW50U2NvcGVIb2xkZXIgPSBtZXRhO1x0XHRcclxuXHR9O1xyXG5cdHZhciBhdHRyc0FyciA9IHV0aWxzLm9ialRvS2V5VmFsdWUobWV0YS5hdHRycywgJ25hbWUnLCAndmFsdWUnKTtcclxuXHR2YXIgYXR0ck9iaiA9IHt9O1xyXG5cdGF0dHJzQXJyLmZvckVhY2goZnVuY3Rpb24oYXR0cil7XHJcblx0XHR2YXIgbmFtZSA9IG5ldyBTdHJUcGwoYXR0ci5uYW1lKS5yZW5kZXIodmFsdWVNZ3IucmVzb2x2ZUFuZFJlbmRlci5iaW5kKG51bGwsIG1ldGEsIGRhdGEpKTtcclxuXHRcdHZhciB2YWx1ZSA9IG5ldyBTdHJUcGwoYXR0ci52YWx1ZSkucmVuZGVyKHZhbHVlTWdyLnJlc29sdmVBbmRSZW5kZXIuYmluZChudWxsLCBtZXRhLCBkYXRhKSk7XHJcblx0XHRhdHRyT2JqW25hbWVdID0gdmFsdWU7XHJcblx0fSk7XHJcblx0dmFyIHRyaWdnZXJzID0gW107XHJcblx0Y29udGV4dC5nYXBTdG9yYWdlLnNldFRyaWdnZXJzKG1ldGEsIHRyaWdnZXJzKTtcdFx0XHJcblx0dmFyIGlubmVyID0gbWV0YS5wYXRoIFxyXG5cdFx0PyB2YWx1ZU1nci5nZXRWYWx1ZShtZXRhLCBkYXRhLCB0aGlzLnJlc29sdmVkUGF0aClcclxuXHRcdDogY29udGV4dC5yZW5kZXJUcGwobWV0YS5jb250ZW50LCBtZXRhLCBkYXRhKTtcclxuXHRyZXR1cm4gdXRpbHMucmVuZGVyVGFnKHtcclxuXHRcdFwibmFtZVwiOiBtZXRhLnRhZ05hbWUsXHJcblx0XHRcImF0dHJzXCI6IGF0dHJPYmosXHJcblx0XHRcImlubmVySFRNTFwiOiBpbm5lclxyXG5cdH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXI7IiwiZnVuY3Rpb24gdXBkYXRlKGNvbnRleHQsIG1ldGEsIHNjb3BlUGF0aCwgdmFsdWUpe1xyXG5cdC8vIHRvIGRvIHZhbHVlIHVwZGF0ZVxyXG5cdHZhciB2YWx1ZU1nciA9IHJlcXVpcmUoJ2ZnLWpzL3ZhbHVlTWdyJyk7XHJcblx0dmFyIHV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMnKTtcclxuXHR2YXIgU3RyVHBsID0gcmVxdWlyZSgnZmctanMvc3RyVHBsLmpzJyk7XHJcblxyXG5cdGZ1bmN0aW9uIHJlbmRlckF0dHJzKGF0dHJzLCBkYXRhKXtcclxuXHRcdHZhciByZXNBdHRycyA9IHt9O1xyXG5cdFx0dXRpbHMub2JqRm9yKGF0dHJzLCBmdW5jdGlvbih2YWx1ZSwgbmFtZSl7XHJcblx0XHRcdHZhciBuYW1lVHBsID0gbmV3IFN0clRwbChuYW1lKTtcclxuXHRcdFx0dmFyIHZhbHVlVHBsID0gbmV3IFN0clRwbCh2YWx1ZSk7XHJcblx0XHRcdHJlc0F0dHJzW25hbWVUcGwucmVuZGVyKGRhdGEpXSA9IHZhbHVlVHBsLnJlbmRlcihkYXRhKTtcdFx0XHJcblx0XHR9KTtcdFxyXG5cdFx0cmV0dXJuIHJlc0F0dHJzO1xyXG5cdH07XHJcblxyXG5cdC8qdmFyIGF0dHJEYXRhID0gdXRpbHMub2JqUGF0aChtZXRhLnNjb3BlUGF0aCwgY29udGV4dC5kYXRhKTtcclxuXHR2YXIgcmVuZGVyZWRBdHRycyA9IHV0aWxzLnJlbmRlckF0dHJzKG1ldGEuYXR0cnMsIGF0dHJEYXRhKTsqL1xyXG5cdHZhciBhdHRyc0FyciA9IHV0aWxzLm9ialRvS2V5VmFsdWUobWV0YS5hdHRycywgJ25hbWUnLCAndmFsdWUnKTtcclxuXHR2YXIgYXR0ck9iaiA9IHt9O1xyXG5cdGF0dHJzQXJyLmZvckVhY2goZnVuY3Rpb24oYXR0cil7XHJcblx0XHR2YXIgbmFtZSA9IG5ldyBTdHJUcGwoYXR0ci5uYW1lKS5yZW5kZXIodmFsdWVNZ3IucmVuZGVyLmJpbmQobnVsbCwgbWV0YSwgY29udGV4dC5kYXRhKSk7XHJcblx0XHR2YXIgdmFsdWUgPSBuZXcgU3RyVHBsKGF0dHIudmFsdWUpLnJlbmRlcihmdW5jdGlvbihwYXRoKXtcclxuXHRcdFx0dmFyIHJlc29sdmVkUGF0aCA9IHZhbHVlTWdyLnJlc29sdmVQYXRoKG1ldGEsIHBhdGgpO1x0XHRcclxuXHRcdFx0cmV0dXJuIHZhbHVlTWdyLnJlbmRlcihtZXRhLCBjb250ZXh0LmRhdGEsIHJlc29sdmVkUGF0aCk7XHJcblx0XHR9KTtcclxuXHRcdGF0dHJPYmpbbmFtZV0gPSB2YWx1ZTtcclxuXHR9KTtcclxuXHR2YXIgZG9tID0gbWV0YS5nZXREb20oKVswXTtcclxuXHRpZiAobWV0YS52YWx1ZSAmJiBtZXRhLnZhbHVlUGF0aC5wYXRoLmpvaW4oJy0nKSA9PSBzY29wZVBhdGguam9pbignLScpKXtcclxuXHRcdGRvbS5pbm5lckhUTUwgPSB2YWx1ZTtcclxuXHR9O1xyXG5cdHV0aWxzLm9iakZvcihhdHRyT2JqLCBmdW5jdGlvbih2YWx1ZSwgbmFtZSl7XHJcblx0XHR2YXIgb2xkVmFsID0gZG9tLmdldEF0dHJpYnV0ZShuYW1lKTtcclxuXHRcdGlmIChvbGRWYWwgIT0gdmFsdWUpe1xyXG5cdFx0XHRkb20uc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcclxuXHRcdH07XHJcblx0fSk7XHRcdFxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB1cGRhdGU7IiwidmFyIHV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMnKTtcdFx0XHJcbnZhciB2YWx1ZU1nciA9IHJlcXVpcmUoJ2ZnLWpzL3ZhbHVlTWdyLmpzJyk7XHJcblxyXG5mdW5jdGlvbiByZW5kZXIoY29udGV4dCwgZGF0YSl7XHJcblx0dmFyIG1ldGEgPSB0aGlzO1xyXG5cdHZhciBzY29wZURhdGEgPSB2YWx1ZU1nci5nZXRWYWx1ZShtZXRhLCBkYXRhLCB0aGlzLnJlc29sdmVkUGF0aCk7XHJcblx0dGhpcy5zY29wZVBhdGggPSB0aGlzLnJlc29sdmVkUGF0aC5wYXRoO1xyXG5cdGlmICghc2NvcGVEYXRhKXtcclxuXHRcdHJldHVybiAnJztcclxuXHR9O1xyXG5cdHJldHVybiBjb250ZXh0LnJlbmRlclRwbChtZXRhLmNvbnRlbnQsIG1ldGEsIGRhdGEpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXI7IiwidmFyIHV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMnKTtcclxudmFyIHZhbHVlTWdyID0gcmVxdWlyZSgnZmctanMvdmFsdWVNZ3IuanMnKTtcclxudmFyIGdhcENsYXNzTWdyID0gcmVxdWlyZSgnZmctanMvY2xpZW50L2dhcENsYXNzTWdyLmpzJyk7XHJcbnZhciByZW5kZXJTY29wZUNvbnRlbnQgPSByZXF1aXJlKCcuL3JlbmRlclNjb3BlQ29udGVudC5qcycpO1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyKGNvbnRleHQsIGRhdGEpe1xyXG5cdHZhciBtZXRhID0gdGhpcztcclxuXHRtZXRhLml0ZW1zID0gW107XHJcblx0Ly9tZXRhLnNjb3BlUGF0aCA9IHV0aWxzLmdldFNjb3BlUGF0aChtZXRhKTtcdFx0XHJcblx0Ly92YXIgc2NvcGVEYXRhID0gdXRpbHMub2JqUGF0aChtZXRhLnNjb3BlUGF0aCwgZGF0YSk7XHJcblx0dmFyIHNjb3BlRGF0YSA9IHZhbHVlTWdyLmdldFZhbHVlKG1ldGEsIGRhdGEsIHRoaXMucmVzb2x2ZWRQYXRoKTtcclxuXHR0aGlzLnNjb3BlUGF0aCA9IHRoaXMucmVzb2x2ZWRQYXRoLnBhdGg7XHJcblx0dmFyIHBsYWNlSG9sZGVySW5uZXIgPSBbJ2ZnJywgY29udGV4dC5pZCwgJ3Njb3BlLWdpZCcsIG1ldGEuZ2lkXS5qb2luKCctJyk7XHJcblx0aWYgKCFzY29wZURhdGEpe1xyXG5cdFx0cmV0dXJuICc8IS0tJyArIHBsYWNlSG9sZGVySW5uZXIgKyAnLS0+JztcclxuXHR9O1x0XHRcclxuXHR2YXIgcGFydHMgPSByZW5kZXJTY29wZUNvbnRlbnQoY29udGV4dCwgbWV0YSwgc2NvcGVEYXRhLCBkYXRhLCAwKTtcclxuXHRwYXJ0cy5wdXNoKCc8IS0tJyArIHBsYWNlSG9sZGVySW5uZXIgKyAnLS0+Jyk7XHJcblx0cmV0dXJuIHBhcnRzLmpvaW4oJ1xcbicpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXI7IiwidmFyIHV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMnKTtcclxudmFyIHZhbHVlTWdyID0gcmVxdWlyZSgnZmctanMvdmFsdWVNZ3IuanMnKTtcclxudmFyIGdhcENsYXNzTWdyID0gcmVxdWlyZSgnZmctanMvY2xpZW50L2dhcENsYXNzTWdyLmpzJyk7XHJcblxyXG5mdW5jdGlvbiByZW5kZXJTY29wZUNvbnRlbnQoY29udGV4dCwgc2NvcGVNZXRhLCBzY29wZURhdGEsIGRhdGEsIGlkT2Zmc2V0KXtcclxuXHR2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoc2NvcGVEYXRhKTtcclxuXHRpZiAoIWlzQXJyYXkpe1xyXG5cdFx0c2NvcGVEYXRhID0gW3Njb3BlRGF0YV07XHJcblx0fTtcclxuXHR2YXIgcGFydHMgPSBzY29wZURhdGEubWFwKGZ1bmN0aW9uKGRhdGFJdGVtLCBpZCl7XHJcblx0XHR2YXIgaXRlbU1ldGEgPSBzY29wZU1ldGE7XHJcblx0XHRpZiAoaXNBcnJheSl7XHJcblx0XHRcdHZhciBpdGVtQ2ZnID0ge1xyXG5cdFx0XHRcdFwidHlwZVwiOiBcInNjb3BlLWl0ZW1cIixcclxuXHRcdFx0XHRcImlzVmlydHVhbFwiOiB0cnVlLFxyXG5cdFx0XHRcdFwicGF0aFwiOiB2YWx1ZU1nci5yZWFkKFsoaWQgKyBpZE9mZnNldCkudG9TdHJpbmcoKV0pLFxyXG5cdFx0XHRcdFwiY29udGVudFwiOiBzY29wZU1ldGEuY29udGVudFxyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAoc2NvcGVNZXRhLmVpZCl7XHJcblx0XHRcdFx0aXRlbUNmZy5laWQgPSBzY29wZU1ldGEuZWlkICsgJy1pdGVtJztcclxuXHRcdFx0fTtcclxuXHRcdFx0aXRlbU1ldGEgPSBuZXcgZ2FwQ2xhc3NNZ3IuR2FwKGNvbnRleHQsIGl0ZW1DZmcsIGl0ZW1NZXRhKTtcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gZ2FwQ2xhc3NNZ3IucmVuZGVyKGNvbnRleHQsIHNjb3BlTWV0YSwgZGF0YSwgaXRlbU1ldGEpO1xyXG5cdH0pO1xyXG5cdHJldHVybiBwYXJ0cztcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcmVuZGVyU2NvcGVDb250ZW50OyIsInZhciByZW5kZXJTY29wZUNvbnRlbnQgPSByZXF1aXJlKCcuL3JlbmRlclNjb3BlQ29udGVudC5qcycpO1xyXG5cclxuZnVuY3Rpb24gdXBkYXRlKGNvbnRleHQsIG1ldGEsIHNjb3BlUGF0aCwgdmFsdWUsIG9sZFZhbHVlKXtcclxuXHR2YXIgdXRpbHMgPSByZXF1aXJlKCdmZy1qcy91dGlscycpO1xyXG5cdHZhciBnYXBDbGFzc01nciA9IHJlcXVpcmUoJ2ZnLWpzL2NsaWVudC9nYXBDbGFzc01nci5qcycpO1xyXG5cdHZhbHVlID0gdmFsdWUgfHwgW107XHJcblx0b2xkVmFsdWUgPSBvbGRWYWx1ZSB8fCBbXTtcclxuXHRmb3IgKHZhciBpID0gdmFsdWUubGVuZ3RoOyBpIDwgb2xkVmFsdWUubGVuZ3RoOyBpKyspe1xyXG5cdFx0Y29udGV4dC5nYXBTdG9yYWdlLnJlbW92ZVNjb3BlKHNjb3BlUGF0aC5jb25jYXQoW2ldKSk7XHJcblx0fTtcclxuXHRpZiAodmFsdWUubGVuZ3RoID4gb2xkVmFsdWUubGVuZ3RoKXtcclxuXHRcdHZhciBzY29wZUhvbGRlciA9IHV0aWxzLmZpbmRTY29wZUhvbGRlcihtZXRhKTtcclxuXHRcdHZhciBub2RlcyA9IFtdLnNsaWNlLmNhbGwoc2NvcGVIb2xkZXIuZ2V0RG9tKClbMF0uY2hpbGROb2Rlcyk7XHJcblx0XHR2YXIgcGxhY2VIb2xkZXJJbm5lciA9IFsnZmcnLCBjb250ZXh0LmlkLCAnc2NvcGUtZ2lkJywgbWV0YS5naWRdLmpvaW4oJy0nKTtcclxuXHRcdHZhciBmb3VuZCA9IG5vZGVzLmZpbHRlcihmdW5jdGlvbihub2RlKXtcclxuXHRcdCAgICBpZiAobm9kZS5ub2RlVHlwZSAhPSA4KXtcclxuXHRcdCAgICAgICAgcmV0dXJuIGZhbHNlXHJcblx0XHQgICAgfTtcclxuXHRcdCAgICBpZiAobm9kZS50ZXh0Q29udGVudCA9PSBwbGFjZUhvbGRlcklubmVyKXtcclxuXHRcdCAgICBcdHJldHVybiB0cnVlO1xyXG5cdFx0ICAgIH07XHRcdFx0ICAgIFxyXG5cdFx0fSk7XHJcblx0XHRmb3VuZCA9IGZvdW5kWzBdO1xyXG5cdFx0dmFyIGRhdGFTbGljZSA9IHZhbHVlLnNsaWNlKG9sZFZhbHVlLmxlbmd0aCk7XHJcblx0XHR2YXIgbmV3Q29udGVudCA9IHJlbmRlclNjb3BlQ29udGVudChjb250ZXh0LCBtZXRhLCBkYXRhU2xpY2UsIGNvbnRleHQuZGF0YSwgb2xkVmFsdWUubGVuZ3RoKS5qb2luKCdcXG4nKTtcclxuXHRcdHV0aWxzLmluc2VydEhUTUxCZWZvcmVDb21tZW50KGZvdW5kLCBuZXdDb250ZW50KTtcclxuXHR9O1xyXG5cdHRoaXM7XHJcblx0Ly9jb250ZXh0LnJlcmVuZGVyKGNvbnRleHQuZGF0YSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHVwZGF0ZTsiLCJmdW5jdGlvbiBTdHJUcGwodHBsLCB2YWx1ZVBhcnNlRm4pe1xyXG5cdGlmICh0eXBlb2YgdHBsID09IFwib2JqZWN0XCIpe1xyXG5cdFx0dGhpcy5zcmMgPSB0cGwuc3JjO1xyXG5cdFx0dGhpcy5nYXBzID0gdHBsLmdhcHM7XHJcblx0XHR0aGlzLnBhcnRzID0gdHBsLnBhcnRzO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH07XHJcbiAgICB0aGlzLnNyYyA9IHRwbDtcclxuICAgIHRoaXMucGFydHMgPSBbXTtcclxuICAgIHRoaXMuZ2FwcyA9IFtdO1xyXG4gICAgcmV0dXJuIHRoaXMucGFyc2UodHBsLCB2YWx1ZVBhcnNlRm4pO1xyXG59O1xyXG5cclxuU3RyVHBsLnJlYWQgPSBmdW5jdGlvbih0cGwsIHZhbHVlUGFyc2VGbil7XHJcblx0dmFyIHJlcyA9IG5ldyBTdHJUcGwodHBsLCB2YWx1ZVBhcnNlRm4pO1xyXG5cdGlmIChyZXMuaXNTdHJpbmcpe1xyXG5cdFx0cmVzID0gdHBsO1xyXG5cdH07XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbnZhciBnYXBSZSA9IC9cXCRcXHtbXlxcfV0qXFx9L2dtO1xyXG5cclxuU3RyVHBsLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKHRwbCwgdmFsdWVQYXJzZUZuKXtcclxuXHR2YXIgZ2FwU3RyQXJyID0gdHBsLm1hdGNoKGdhcFJlKVxyXG5cdGlmICghZ2FwU3RyQXJyKXtcclxuXHRcdHRoaXMuaXNTdHJpbmcgPSB0cnVlO1xyXG5cdFx0dGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH07XHJcblx0Z2FwU3RyQXJyID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdHJldHVybiBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHR9KTtcdFxyXG5cdHRoaXMuZ2FwcyA9IGdhcFN0ckFyci5tYXAodmFsdWVQYXJzZUZuKTtcclxuXHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcbmZ1bmN0aW9uIG1peEFycmF5cyhhcnJheXMpe1xyXG5cdHZhciBpZCA9IDA7XHJcblx0dmFyIG1heExlbmd0aCA9IDA7XHJcblx0dmFyIHRvdGFsTGVuZ3RoID0gMDtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKyl7XHJcblx0XHRtYXhMZW5ndGggPSBNYXRoLm1heChhcmd1bWVudHNbaV0ubGVuZ3RoLCBtYXhMZW5ndGgpO1xyXG5cdFx0dG90YWxMZW5ndGggKz0gYXJndW1lbnRzW2ldLmxlbmd0aDtcclxuXHR9O1xyXG5cdHZhciByZXNBcnIgPSBbXTtcclxuXHR2YXIgYXJyYXlDb3VudCA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcblx0Zm9yICh2YXIgaWQgPSAwOyBpZCA8IG1heExlbmd0aDsgaWQrKyl7XHRcdFx0XHRcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlDb3VudDsgaSsrKXtcclxuXHRcdFx0aWYgKGFyZ3VtZW50c1tpXS5sZW5ndGggPiBpZCl7XHJcblx0XHRcdFx0cmVzQXJyLnB1c2goYXJndW1lbnRzW2ldW2lkXSk7XHJcblx0XHRcdH07XHJcblx0XHR9O1xyXG5cdH07XHJcblx0cmV0dXJuIHJlc0FycjtcclxufTtcclxuXHJcblN0clRwbC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24odmFsdWVSZW5kZXJGbil7XHJcblx0dmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdHZhciBwYXJ0cyA9IG1peEFycmF5cyh0aGlzLnBhcnRzLCBnYXBzKTtcclxuXHRyZXR1cm4gcGFydHMuam9pbignJyk7XHRcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3RyVHBsOyIsInZhciB1dGlscyA9IHJlcXVpcmUoJ2ZnLWpzL3V0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiByZW5kZXJUcGwodHBsLCBwYXJlbnQsIGRhdGEsIG1ldGEpe1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHR2YXIgcGFydHMgPSB0cGwubWFwKGZ1bmN0aW9uKHBhcnQsIHBhcnRJZCl7XHJcblx0XHRpZiAodHlwZW9mIHBhcnQgPT0gXCJzdHJpbmdcIil7XHJcblx0XHRcdHJldHVybiBwYXJ0O1xyXG5cdFx0fTtcclxuXHRcdHZhciBwYXJ0TWV0YSA9IHV0aWxzLnNpbXBsZUNsb25lKHBhcnQpO1xyXG5cdFx0aWYgKG1ldGEpe1xyXG5cdFx0XHRpZiAodHlwZW9mIG1ldGEgPT0gXCJmdW5jdGlvblwiKXtcclxuXHRcdFx0XHRwYXJ0TWV0YSA9IG1ldGEocGFydE1ldGEsIHBhcnRJZCk7XHJcblx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdHBhcnRNZXRhID0gdXRpbHMuZXh0ZW5kKHBhcnRNZXRhLCBtZXRhIHx8IHt9KTtcdFx0XHRcclxuXHRcdFx0fTtcdFxyXG5cdFx0fTtcdFx0XHJcblx0XHRyZXR1cm4gc2VsZi5nYXBDbGFzc01nci5yZW5kZXIoc2VsZi5jb250ZXh0LCBwYXJlbnQsIGRhdGEsIHBhcnRNZXRhKTtcclxuXHR9KTtcclxuXHR2YXIgY29kZSA9IHBhcnRzLmpvaW4oJycpO1xyXG5cdHJldHVybiBjb2RlO1xyXG59O1xyXG5cclxuZXhwb3J0cy5yZW5kZXJUcGwgPSByZW5kZXJUcGw7IiwidmFyIHRwbFV0aWxzID0gcmVxdWlyZSgnZmctanMvdXRpbHMvdHBsVXRpbHMuanMnKTtcclxudmFyIHZhbHVlTWdyID0gcmVxdWlyZSgnZmctanMvdmFsdWVNZ3IuanMnKTtcclxuZXh0ZW5kKGV4cG9ydHMsIHRwbFV0aWxzKTtcclxuXHJcbmZ1bmN0aW9uIG9iakZvcihvYmosIGZuKXtcclxuXHRmb3IgKHZhciBpIGluIG9iail7XHJcblx0XHRmbihvYmpbaV0sIGksIG9iaik7XHJcblx0fTtcclxufTtcclxuZXhwb3J0cy5vYmpGb3IgPSBvYmpGb3I7XHJcblxyXG5mdW5jdGlvbiBvYmpNYXAob2JqLCBmbil7XHJcblx0dmFyIG5ld09iaiA9IHt9O1xyXG5cdG9iakZvcihvYmosIGZ1bmN0aW9uKGl0ZW0sIGlkKXtcclxuXHRcdHZhciBuZXdJdGVtID0gZm4oaXRlbSwgaWQsIG9iaik7XHJcblx0XHRuZXdPYmpbaWRdID0gbmV3SXRlbTtcclxuXHR9KTtcclxuXHRyZXR1cm4gbmV3T2JqO1xyXG59O1xyXG5leHBvcnRzLm9iak1hcCA9IG9iak1hcDtcclxuXHJcbmZ1bmN0aW9uIG9ialBhdGgocGF0aCwgb2JqLCBuZXdWYWwpe1xyXG5cdGlmIChwYXRoLmxlbmd0aCA8IDEpe1xyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKXtcclxuXHRcdFx0dGhyb3cgJ3Jvb3QgcmV3cml0dGluZyBpcyBub3Qgc3VwcG9ydGVkJztcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gb2JqO1xyXG5cdH07XHJcblx0dmFyIHByb3BOYW1lID0gcGF0aFswXTtcclxuXHRpZiAocGF0aC5sZW5ndGggPT0gMSl7XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpe1xyXG5cdFx0XHRvYmpbcHJvcE5hbWVdID0gbmV3VmFsOyBcclxuXHRcdH07XHRcdFx0XHRcclxuXHRcdHJldHVybiBvYmpbcHJvcE5hbWVdO1x0XHJcblx0fTtcclxuXHR2YXIgc3ViT2JqID0gb2JqW3Byb3BOYW1lXTtcclxuXHRpZiAoc3ViT2JqID09PSB1bmRlZmluZWQpe1xyXG5cdFx0Ly90aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmVhZCBcIiArIHByb3BOYW1lICsgXCIgb2YgdW5kZWZpbmVkXCIpO1xyXG5cdFx0cmV0dXJuIHVuZGVmaW5lZDsgLy8gdGhyb3c/XHJcblx0fTtcdFx0XHJcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKXtcclxuXHRcdHJldHVybiBvYmpQYXRoKHBhdGguc2xpY2UoMSksIHN1Yk9iaiwgbmV3VmFsKTtcclxuXHR9O1xyXG5cdHJldHVybiBvYmpQYXRoKHBhdGguc2xpY2UoMSksIHN1Yk9iaik7XHJcbn07XHJcbmV4cG9ydHMub2JqUGF0aCA9IG9ialBhdGg7XHJcblxyXG5cclxuZnVuY3Rpb24gYXR0cnNUb09iaihhdHRycyl7XHJcblx0dmFyIHJlcyA9IHt9O1xyXG5cdGF0dHJzLmZvckVhY2goZnVuY3Rpb24oaSl7XHJcblx0XHRyZXNbaS5uYW1lXSA9IGkudmFsdWU7XHJcblx0fSk7IFxyXG5cdHJldHVybiByZXM7XHJcbn07XHJcbmV4cG9ydHMuYXR0cnNUb09iaiA9IGF0dHJzVG9PYmo7XHJcblxyXG5cclxuZnVuY3Rpb24gc2ltcGxlQ2xvbmUob2JqKXtcclxuXHR2YXIgcmVzID0ge307XHJcblx0Zm9yICh2YXIgaSBpbiBvYmope1xyXG5cdFx0cmVzW2ldID0gb2JqW2ldO1xyXG5cdH07XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuZXhwb3J0cy5zaW1wbGVDbG9uZSA9IHNpbXBsZUNsb25lO1xyXG5cclxuXHJcbmZ1bmN0aW9uIG1peEFycmF5cyhhcnJheXMpe1xyXG5cdHZhciBpZCA9IDA7XHJcblx0dmFyIG1heExlbmd0aCA9IDA7XHJcblx0dmFyIHRvdGFsTGVuZ3RoID0gMDtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKyl7XHJcblx0XHRtYXhMZW5ndGggPSBNYXRoLm1heChhcmd1bWVudHNbaV0ubGVuZ3RoLCBtYXhMZW5ndGgpO1xyXG5cdFx0dG90YWxMZW5ndGggKz0gYXJndW1lbnRzW2ldLmxlbmd0aDtcclxuXHR9O1xyXG5cdHZhciByZXNBcnIgPSBbXTtcclxuXHR2YXIgYXJyYXlDb3VudCA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcblx0Zm9yICh2YXIgaWQgPSAwOyBpZCA8IG1heExlbmd0aDsgaWQrKyl7XHRcdFx0XHRcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlDb3VudDsgaSsrKXtcclxuXHRcdFx0aWYgKGFyZ3VtZW50c1tpXS5sZW5ndGggPiBpZCl7XHJcblx0XHRcdFx0cmVzQXJyLnB1c2goYXJndW1lbnRzW2ldW2lkXSk7XHJcblx0XHRcdH07XHJcblx0XHR9O1xyXG5cdH07XHJcblx0cmV0dXJuIHJlc0FycjtcclxufTtcclxuZXhwb3J0cy5taXhBcnJheXMgPSBtaXhBcnJheXM7XHJcblxyXG5mdW5jdGlvbiByZXNvbHZlUGF0aChyb290UGF0aCwgcmVsUGF0aCl7XHJcblx0dmFyIHJlc1BhdGggPSByb290UGF0aC5zbGljZSgpO1xyXG5cdHJlbFBhdGggPSByZWxQYXRoIHx8IFtdO1xyXG5cdHJlbFBhdGguZm9yRWFjaChmdW5jdGlvbihrZXkpe1xyXG5cdFx0aWYgKGtleSA9PSBcIl9yb290XCIpe1xyXG5cdFx0XHRyZXNQYXRoID0gW107XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH07XHJcblx0XHRyZXNQYXRoLnB1c2goa2V5KTtcclxuXHR9KTtcclxuXHRyZXR1cm4gcmVzUGF0aDtcclxufTtcclxuZXhwb3J0cy5yZXNvbHZlUGF0aCA9IHJlc29sdmVQYXRoO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGdldFNjb3BlUGF0aChtZXRhKXtcclxuXHR2YXJcdHBhcmVudFBhdGggPSBbXTtcclxuXHRpZiAobWV0YS5wYXJlbnQpe1xyXG5cdFx0cGFyZW50UGF0aCA9IG1ldGEucGFyZW50LnNjb3BlUGF0aDtcclxuXHRcdGlmICghcGFyZW50UGF0aCl7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlBhcmVudCBlbG0gbXVzdCBoYXZlIHNjb3BlUGF0aFwiKTtcclxuXHRcdH07XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzb2x2ZVBhdGgocGFyZW50UGF0aCwgbWV0YS5wYXRoKVxyXG59O1xyXG5leHBvcnRzLmdldFNjb3BlUGF0aCA9IGdldFNjb3BlUGF0aDtcclxuXHJcbmZ1bmN0aW9uIGtleVZhbHVlVG9PYmooYXJyLCBrZXlOYW1lLCB2YWx1ZU5hbWUpe1xyXG5cdGtleU5hbWUgPSBrZXlOYW1lIHx8ICdrZXknO1xyXG5cdHZhbHVlTmFtZSA9IHZhbHVlTmFtZSB8fCAndmFsdWUnO1xyXG5cdHZhciByZXMgPSB7fTtcclxuXHRhcnIuZm9yRWFjaChmdW5jdGlvbihpKXtcclxuXHRcdHJlc1tpW2tleU5hbWVdXSA9IGlbdmFsdWVOYW1lXTtcclxuXHR9KTsgXHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuZXhwb3J0cy5rZXlWYWx1ZVRvT2JqID0ga2V5VmFsdWVUb09iajtcdFxyXG5cclxuZnVuY3Rpb24gb2JqVG9LZXlWYWx1ZShvYmosIGtleU5hbWUsIHZhbHVlTmFtZSl7XHJcblx0a2V5TmFtZSA9IGtleU5hbWUgfHwgJ2tleSc7XHJcblx0dmFsdWVOYW1lID0gdmFsdWVOYW1lIHx8ICd2YWx1ZSc7XHJcblx0dmFyIHJlcyA9IFtdO1xyXG5cdGZvciAodmFyIGkgaW4gb2JqKXtcclxuXHRcdHZhciBpdGVtID0ge307XHJcblx0XHRpdGVtW2tleU5hbWVdID0gaTtcclxuXHRcdGl0ZW1bdmFsdWVOYW1lXSA9IG9ialtpXTtcclxuXHRcdHJlcy5wdXNoKGl0ZW0pO1xyXG5cdH07XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuZXhwb3J0cy5vYmpUb0tleVZhbHVlID0gb2JqVG9LZXlWYWx1ZTtcclxuXHJcbmZ1bmN0aW9uIGNsb25lKG9iail7XHJcblx0cmV0dXJuIE9iamVjdC5jcmVhdGUob2JqKTtcclxufTtcclxuZXhwb3J0cy5jbG9uZSA9IGNsb25lO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGNvbmNhdE9iaihvYmoxLCBvYmoyKXtcclxuXHR2YXIgcmVzID0gc2ltcGxlQ2xvbmUob2JqMSk7XHJcblx0Zm9yICh2YXIgaSBpbiBvYmoyKXtcclxuXHRcdHJlc1tpXSA9IG9iajJbaV07XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5leHBvcnRzLmNvbmNhdE9iaiA9IGNvbmNhdE9iajtcclxuXHJcbmZ1bmN0aW9uIGV4dGVuZChkZXN0LCBzcmMpe1x0XHJcblx0Zm9yICh2YXIgaSBpbiBzcmMpe1xyXG5cdFx0ZGVzdFtpXSA9IHNyY1tpXTtcclxuXHR9O1xyXG5cdHJldHVybiBkZXN0O1xyXG59O1xyXG5leHBvcnRzLmV4dGVuZCA9IGV4dGVuZDtcclxuXHJcbmZ1bmN0aW9uIGZpbmRTY29wZUhvbGRlcihtZXRhKXtcclxuICAgIHZhciBub2RlID0gbWV0YS5wYXJlbnQ7XHJcbiAgICB3aGlsZSAobm9kZSl7XHJcbiAgICAgICAgaWYgKG5vZGUuaXNTY29wZUhvbGRlcil7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50OyAgXHJcbiAgICB9O1xyXG4gICAgdGhyb3cgJ2Nhbm5vdCBmaW5kIHNjb3BlIGhvbGRlcic7XHJcbn07XHJcbmV4cG9ydHMuZmluZFNjb3BlSG9sZGVyID0gZmluZFNjb3BlSG9sZGVyO1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyU2NvcGVDb250ZW50KGNvbnRleHQsIHNjb3BlTWV0YSwgc2NvcGVEYXRhLCBkYXRhLCBpZE9mZnNldCl7XHJcblx0dmFyIGdhcENsYXNzTWdyID0gcmVxdWlyZSgnZmctanMvY2xpZW50L2dhcENsYXNzTWdyLmpzJyk7XHJcblx0dmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHNjb3BlRGF0YSk7XHJcblx0aWYgKCFpc0FycmF5KXtcclxuXHRcdHNjb3BlRGF0YSA9IFtzY29wZURhdGFdO1xyXG5cdH07XHJcblx0dmFyIHBhcnRzID0gc2NvcGVEYXRhLm1hcChmdW5jdGlvbihkYXRhSXRlbSwgaWQpe1xyXG5cdFx0dmFyIGl0ZW1NZXRhID0gc2NvcGVNZXRhO1xyXG5cdFx0aWYgKGlzQXJyYXkpe1xyXG5cdFx0XHR2YXIgaXRlbUNmZyA9IHtcclxuXHRcdFx0XHRcInR5cGVcIjogXCJzY29wZS1pdGVtXCIsXHJcblx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogdHJ1ZSxcclxuXHRcdFx0XHRcInBhdGhcIjogW2lkICsgaWRPZmZzZXRdLFxyXG5cdFx0XHRcdFwiY29udGVudFwiOiBzY29wZU1ldGEuY29udGVudFxyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAoc2NvcGVNZXRhLmVpZCl7XHJcblx0XHRcdFx0aXRlbUNmZy5laWQgPSBzY29wZU1ldGEuZWlkICsgJy1pdGVtJztcclxuXHRcdFx0fTtcclxuXHRcdFx0aXRlbU1ldGEgPSBuZXcgZ2FwQ2xhc3NNZ3IuR2FwKGNvbnRleHQsIGl0ZW1DZmcsIGl0ZW1NZXRhKTtcclxuXHRcdFx0Y29udGV4dC5nYXBTdG9yYWdlLnNldFRyaWdnZXJzKGl0ZW1NZXRhLCBbaXRlbU1ldGEuc2NvcGVQYXRoXSk7XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIGdhcENsYXNzTWdyLnJlbmRlcihjb250ZXh0LCBzY29wZU1ldGEsIGRhdGEsIGl0ZW1NZXRhKTtcclxuXHR9KTtcclxuXHRyZXR1cm4gcGFydHM7XHJcbn07XHJcbmV4cG9ydHMucmVuZGVyU2NvcGVDb250ZW50ID0gcmVuZGVyU2NvcGVDb250ZW50O1xyXG5cclxuZnVuY3Rpb24gaW5zZXJ0SFRNTEJlZm9yZUNvbW1lbnQoY29tbWVudEVsbSwgaHRtbCl7XHJcblx0dmFyIHByZXYgPSBjb21tZW50RWxtLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XHJcblx0aWYgKHByZXYpe1xyXG5cdFx0cHJldi5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyZW5kJywgaHRtbCk7XHJcblx0XHRyZXR1cm47XHJcblx0fTtcclxuXHRjb21tZW50RWxtLnBhcmVudE5vZGUuaW5zZXJ0QWRqYWNlbnRIVE1MKCdhZnRlcmJlZ2luJywgaHRtbCk7XHJcbn07XHJcbmV4cG9ydHMuaW5zZXJ0SFRNTEJlZm9yZUNvbW1lbnQgPSBpbnNlcnRIVE1MQmVmb3JlQ29tbWVudDtcclxuXHJcblxyXG5mdW5jdGlvbiBwYXJzZVBhdGgocGFyc2VkTm9kZSl7XHJcblx0aWYgKHBhcnNlZE5vZGUuYXR0cnMuY2xhc3Mpe1xyXG5cdFx0dmFyIHBhcnRzID0gcGFyc2VkTm9kZS5hdHRycy5jbGFzcy52YWx1ZS5zcGxpdCgnICcpO1xyXG5cdFx0dmFyIHBhcnNlZCA9ICB2YWx1ZU1nci5yZWFkKHBhcnRzKTtcclxuXHRcdHJldHVybiBwYXJzZWQ7XHJcblx0fTtcclxuXHRyZXR1cm4gdmFsdWVNZ3IucmVhZChbXSk7XHJcbn07XHJcbmV4cG9ydHMucGFyc2VQYXRoID0gcGFyc2VQYXRoO1xyXG5cclxuZnVuY3Rpb24gb2JqTWFwKG9iaiwgZm4pe1xyXG5cdHZhciByZXMgPSB7fTtcclxuXHRvYmpGb3Iob2JqLCBmdW5jdGlvbih2YWwsIGlkKXtcclxuXHRcdHJlc1tpZF0gPSBmbih2YWwsIGlkLCBvYmopO1xyXG5cdH0pO1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcbmV4cG9ydHMub2JqTWFwID0gb2JqTWFwO1xyXG5cclxuZnVuY3Rpb24gZGVlcENsb25lKG9iail7XHJcblx0aWYgKHR5cGVvZiBvYmogPT0gXCJvYmplY3RcIil7XHJcblx0XHR2YXIgbWFwID0gQXJyYXkuaXNBcnJheShvYmopXHJcblx0XHRcdD8gb2JqLm1hcC5iaW5kKG9iailcclxuXHRcdFx0OiBvYmpNYXAuYmluZChudWxsLCBvYmopO1xyXG5cdFx0cmV0dXJuIG1hcChkZWVwQ2xvbmUpO1xyXG5cdH07XHJcblx0cmV0dXJuIG9iajtcclxufTtcclxuZXhwb3J0cy5kZWVwQ2xvbmUgPSBkZWVwQ2xvbmU7XHJcblxyXG5mdW5jdGlvbiBnZXRBdHRyc1BhdGhzKGF0dHJzKXtcclxuXHR2YXIgcGF0aHMgPSBbXTtcclxuXHRvYmpGb3IoYXR0cnMsIGZ1bmN0aW9uKHZhbHVlLCBuYW1lKXtcclxuXHRcdHZhciBuYW1lVHBsID0gbmV3IFN0clRwbChuYW1lKTtcclxuXHRcdHZhciB2YWx1ZVRwbCA9IG5ldyBTdHJUcGwodmFsdWUpO1xyXG5cdFx0cGF0aHMgPSBwYXRocy5jb25jYXQobmFtZVRwbC5nZXRQYXRocygpLCB2YWx1ZVRwbC5nZXRQYXRocygpKTtcdFx0XHJcblx0fSk7XHJcblx0cmV0dXJuIHBhdGhzO1xyXG59O1xyXG5leHBvcnRzLmdldEF0dHJzUGF0aHMgPSBnZXRBdHRyc1BhdGhzOyIsInZhciB1dGlscyA9IHJlcXVpcmUoJ2ZnLWpzL3V0aWxzLmpzJyk7XHJcblxyXG52YXIgc2VsZkNsb3NpbmdUYWdzID0gW1wiYXJlYVwiLCBcImJhc2VcIiwgXCJiclwiLCBcImNvbFwiLCBcclxuXHRcImNvbW1hbmRcIiwgXCJlbWJlZFwiLCBcImhyXCIsIFwiaW1nXCIsIFxyXG5cdFwiaW5wdXRcIiwgXCJrZXlnZW5cIiwgXCJsaW5rXCIsIFxyXG5cdFwibWV0YVwiLCBcInBhcmFtXCIsIFwic291cmNlXCIsIFwidHJhY2tcIiwgXHJcblx0XCJ3YnJcIl07XHJcblxyXG5mdW5jdGlvbiByZW5kZXJUYWcodGFnSW5mbyl7XHJcblx0dmFyIGF0dHJzID0gdGFnSW5mby5hdHRycztcclxuXHRpZiAoIUFycmF5LmlzQXJyYXkoYXR0cnMpKXtcclxuXHRcdGF0dHJzID0gdXRpbHMub2JqVG9LZXlWYWx1ZShhdHRycywgJ25hbWUnLCAndmFsdWUnKTtcclxuXHR9O1xyXG5cdHZhciBhdHRyQ29kZSA9IFwiXCI7XHJcblx0aWYgKGF0dHJzLmxlbmd0aCA+IDApe1xyXG5cdCAgICBhdHRyQ29kZSA9IFwiIFwiICsgYXR0cnMubWFwKGZ1bmN0aW9uKGF0dHIpe1xyXG5cdFx0ICByZXR1cm4gYXR0ci5uYW1lICsgJz1cIicgKyBhdHRyLnZhbHVlICsgJ1wiJztcclxuXHQgICB9KS5qb2luKCcgJyk7XHJcblx0fTtcclxuXHR2YXIgdGFnSGVhZCA9IHRhZ0luZm8ubmFtZSArIGF0dHJDb2RlO1xyXG5cdGlmICh+c2VsZkNsb3NpbmdUYWdzLmluZGV4T2YodGFnSW5mby5uYW1lKSl7XHJcblx0XHRyZXR1cm4gXCI8XCIgKyB0YWdIZWFkICsgXCIgLz5cIjtcclxuXHR9O1xyXG5cdHZhciBvcGVuVGFnID0gXCI8XCIgKyB0YWdIZWFkICsgXCI+XCI7XHJcblx0dmFyIGNsb3NlVGFnID0gXCI8L1wiICsgdGFnSW5mby5uYW1lICsgXCI+XCI7XHJcblx0dmFyIGNvZGUgPSBvcGVuVGFnICsgKHRhZ0luZm8uaW5uZXJIVE1MIHx8IFwiXCIpICsgY2xvc2VUYWc7XHJcblx0cmV0dXJuIGNvZGU7XHJcbn07XHJcbmV4cG9ydHMucmVuZGVyVGFnID0gcmVuZGVyVGFnO1x0XHJcblxyXG4iLCJmdW5jdGlvbiBOb2RlKGtpbmQsIHBhcmVudCwgZGF0YSl7XHJcbiAgICB0aGlzLmNoaWxkcmVuID0ga2luZCA9PSAnYXJyYXknXHJcbiAgICAgICAgPyBbXVxyXG4gICAgICAgIDoge307ICAgXHJcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICB0aGlzLmNoaWxkQ291bnQgPSAwO1xyXG59O1xyXG5cclxuTm9kZS5wcm90b3R5cGUuYWRkQ2hpbGQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKXtcclxuICAgIGlmICh0aGlzLmtpbmQgPT0gJ2FycmF5Jyl7XHJcbiAgICAgICAgZGF0YSA9IG5hbWU7XHJcbiAgICAgICAgbmFtZSA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgfTtcclxuICAgIGRhdGEgPSBkYXRhIHx8IHRoaXMucm9vdC5pbml0Tm9kZSgpO1xyXG4gICAgdmFyIGNoaWxkID0gbmV3IE5vZGUodGhpcy5raW5kLCB0aGlzLCBkYXRhKTtcclxuICAgIGNoaWxkLmlkID0gbmFtZTtcclxuICAgIGNoaWxkLnBhdGggPSB0aGlzLnBhdGguY29uY2F0KFtuYW1lXSk7XHJcbiAgICBjaGlsZC5yb290ID0gdGhpcy5yb290O1xyXG4gICAgdGhpcy5jaGlsZENvdW50Kys7XHJcbiAgICB0aGlzLmNoaWxkcmVuW25hbWVdID0gY2hpbGQ7XHJcbiAgICByZXR1cm4gY2hpbGQ7XHJcbn07XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5nZXRQYXJlbnRzID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciByZXMgPSBbXTsgICAgXHJcbiAgICB2YXIgbm9kZSA9IHRoaXM7XHJcbiAgICB3aGlsZSAodHJ1ZSl7XHJcbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50O1xyXG4gICAgICAgIGlmICghbm9kZSl7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXMucHVzaChub2RlKTtcclxuICAgIH07ICBcclxufTtcclxuXHJcbk5vZGUucHJvdG90eXBlLmNoaWxkSXRlcmF0ZSA9IGZ1bmN0aW9uKGZuKXtcclxuICAgIGZvciAodmFyIGkgaW4gdGhpcy5jaGlsZHJlbil7XHJcbiAgICAgICAgZm4uY2FsbCh0aGlzLCB0aGlzLmNoaWxkcmVuW2ldLCBpKTsgIFxyXG4gICAgfTtcclxufTtcclxuXHJcbk5vZGUucHJvdG90eXBlLmdldENoaWxkQXJyID0gZnVuY3Rpb24oKXtcclxuICAgIGlmICh0aGlzLmtpbmQgPT0gJ2FycmF5Jyl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hpbGRyZW47XHJcbiAgICB9O1xyXG4gICAgdmFyIHJlcyA9IFtdO1xyXG4gICAgdGhpcy5jaGlsZEl0ZXJhdGUoZnVuY3Rpb24oY2hpbGQpe1xyXG4gICAgICAgIHJlcy5wdXNoKGNoaWxkKTtcclxuICAgIH0pOyAgICAgICAgICAgIFxyXG4gICAgcmV0dXJuIHJlcztcclxufTtcclxuXHJcbk5vZGUucHJvdG90eXBlLmdldERlZXBDaGlsZEFyciA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcmVzID0gdGhpcy5nZXRDaGlsZEFycigpO1xyXG4gICAgdGhpcy5jaGlsZEl0ZXJhdGUoZnVuY3Rpb24oY2hpbGQpe1xyXG4gICAgICAgcmVzID0gcmVzLmNvbmNhdChjaGlsZC5nZXREZWVwQ2hpbGRBcnIoKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXM7XHJcbn07XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihwYXRoKXtcclxuICAgIHZhciBsZWFmS2V5ID0gcGF0aFtwYXRoLmxlbmd0aCAtIDFdO1xyXG4gICAgdmFyIGJyYW5jaFBhdGggPSBwYXRoLnNsaWNlKDAsIC0xKTtcclxuICAgIHZhciBicmFuY2ggPSB0aGlzLmJ5UGF0aChicmFuY2hQYXRoKTtcclxuICAgIGJyYW5jaC5jaGlsZENvdW50LS07XHJcbiAgICB2YXIgcmVzID0gYnJhbmNoLmNoaWxkcmVuW2xlYWZLZXldO1xyXG4gICAgZGVsZXRlIGJyYW5jaC5jaGlsZHJlbltsZWFmS2V5XTsgICBcclxuICAgIHJldHVybiByZXM7IFxyXG59O1xyXG5cclxuTm9kZS5wcm90b3R5cGUuYnlQYXRoID0gZnVuY3Rpb24ocGF0aCl7ICAgIFxyXG4gICAgaWYgKHBhdGgubGVuZ3RoID09IDApe1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIHZhciBub2RlID0gdGhpcztcclxuICAgIHdoaWxlICh0cnVlKXtcclxuICAgICAgICB2YXIga2V5ID0gcGF0aFswXTtcclxuICAgICAgICBub2RlID0gbm9kZS5jaGlsZHJlbltrZXldO1xyXG4gICAgICAgIGlmICghbm9kZSl7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcGF0aCA9IHBhdGguc2xpY2UoMSk7XHJcbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09IDApe1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZTsgIFxyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG59O1xyXG5cclxuTm9kZS5wcm90b3R5cGUuYWNjZXNzID0gZnVuY3Rpb24ocGF0aCl7XHJcbiAgICBpZiAocGF0aC5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgdmFyIG5vZGUgPSB0aGlzO1xyXG4gICAgd2hpbGUgKHRydWUpe1xyXG4gICAgICAgIHZhciBrZXkgPSBwYXRoWzBdO1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlO1xyXG4gICAgICAgIG5vZGUgPSBub2RlLmNoaWxkcmVuW2tleV07XHJcbiAgICAgICAgaWYgKCFub2RlKXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLnJvb3QuaW5pdE5vZGUoKTsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIG5vZGUgPSBwYXJlbnQuYWRkQ2hpbGQoa2V5LCBkYXRhKTtcclxuICAgICAgICAgICAgcGFyZW50LmNoaWxkcmVuW2tleV0gPSBub2RlO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcGF0aCA9IHBhdGguc2xpY2UoMSk7XHJcbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09IDApe1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZTsgIFxyXG4gICAgICAgIH07XHJcbiAgICB9OyBcclxufTtcclxuXHJcbmZ1bmN0aW9uIFRyZWVIZWxwZXIob3B0cywgcm9vdERhdGEpe1xyXG4gICAgb3B0cyA9IG9wdHMgfHwge307XHJcbiAgICBvcHRzLmtpbmQgPSBvcHRzLmtpbmQgfHwgJ2FycmF5JztcclxuICAgIHZhciBpbml0Tm9kZSA9IG9wdHMuaW5pdE5vZGUgfHwgZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4ge307XHJcbiAgICB9O1xyXG4gICAgdmFyIGRhdGEgPSByb290RGF0YSB8fCBpbml0Tm9kZSgpO1xyXG4gICAgdmFyIHJvb3ROb2RlID0gbmV3IE5vZGUob3B0cy5raW5kLCBudWxsLCBkYXRhKTtcclxuICAgIHJvb3ROb2RlLmlzUm9vdCA9IHRydWU7XHJcbiAgICByb290Tm9kZS5yb290ID0gcm9vdE5vZGU7XHJcbiAgICByb290Tm9kZS5wYXRoID0gW107XHJcbiAgICByb290Tm9kZS5pbml0Tm9kZSA9IGluaXROb2RlO1xyXG4gICAgcmV0dXJuIHJvb3ROb2RlO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmVlSGVscGVyOyIsInZhciB1dGlscyA9IHJlcXVpcmUoJ2ZnLWpzL3V0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiByZWFkKHBhcnRzKXtcclxuXHR2YXIgc291cmNlID0gXCJkYXRhXCI7XHJcblx0dmFyIHBhdGggPSBwYXJ0cy5tYXAoZnVuY3Rpb24ocGFydCl7XHRcdFxyXG5cdFx0aWYgKHBhcnRbMF0gPT0gJyQnKXtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRvcDogcGFydC5zbGljZSgxKVxyXG5cdFx0XHR9O1xyXG5cdFx0fTtcclxuXHRcdHJldHVybiBwYXJ0OyBcclxuXHR9KTtcclxuXHRyZXR1cm4ge1xyXG5cdFx0XCJzb3VyY2VcIjogc291cmNlLFxyXG5cdFx0XCJwYXRoXCI6IHBhdGhcclxuXHR9O1xyXG59O1xyXG5leHBvcnRzLnJlYWQgPSByZWFkO1xyXG5cclxuZnVuY3Rpb24gcGFyc2Uoc3RyKXtcclxuXHR2YXIgcGFydHMgPSBzdHIuc3BsaXQoJy4nKTtcclxuXHRyZXR1cm4gcmVhZChwYXJ0cyk7XHJcbn07XHJcbmV4cG9ydHMucGFyc2UgPSBwYXJzZTtcclxuXHJcbmZ1bmN0aW9uIGZpbmRTY29wZVBhdGgobWV0YSl7XHJcblx0dmFyIHBhcmVudCA9IG1ldGEucGFyZW50O1xyXG5cdHdoaWxlICh0cnVlKXtcdFx0XHJcblx0XHRpZiAoIXBhcmVudCl7XHJcblx0XHRcdHJldHVybiBbXTtcclxuXHRcdH07XHJcblx0XHRpZiAocGFyZW50LnNjb3BlUGF0aCl7XHJcblx0XHRcdHJldHVybiBwYXJlbnQuc2NvcGVQYXRoO1xyXG5cdFx0fTtcclxuXHRcdHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XHJcblx0fTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHJlc29sdmVQYXRoKG1ldGEsIHBhdGgpe1xyXG5cdHZhciBzY29wZVBhdGggPSBmaW5kU2NvcGVQYXRoKG1ldGEpO1xyXG5cdHZhciByZXMgPSB7XHJcblx0XHRzb3VyY2U6IFwiZGF0YVwiXHJcblx0fTtcclxuXHRyZXMucGF0aCA9IHNjb3BlUGF0aC5zbGljZSgpO1xyXG5cdHBhdGgucGF0aC5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XHJcblx0XHRpZiAodHlwZW9mIGtleSA9PSBcInN0cmluZ1wiKXtcclxuXHRcdFx0cmVzLnBhdGgucHVzaChrZXkpO1x0XHRcdFxyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9O1xyXG5cdFx0aWYgKGtleS5vcCA9PSBcInJvb3RcIil7XHJcblx0XHRcdHJlcy5wYXRoID0gW107XHJcblx0XHR9IGVsc2UgaWYgKGtleS5vcCA9PSBcInVwXCIpe1xyXG5cdFx0XHRyZXMucGF0aC5wb3AoKTtcclxuXHRcdH07XHJcblx0fSk7XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuZXhwb3J0cy5yZXNvbHZlUGF0aCA9IHJlc29sdmVQYXRoO1xyXG5cclxuZnVuY3Rpb24gZ2V0VmFsdWUobWV0YSwgZGF0YSwgcmVzb2x2ZWRQYXRoKXtcclxuXHR2YXIgc291cmNlVGFibGUgPSB7XHJcblx0XHRcImRhdGFcIjogZGF0YSxcclxuXHRcdFwibWV0YVwiOiBtZXRhXHJcblx0fTtcclxuXHR2YXIgc291cmNlRGF0YSA9IHNvdXJjZVRhYmxlW3Jlc29sdmVkUGF0aC5zb3VyY2VdO1xyXG5cdHZhciByZXMgPSB1dGlscy5vYmpQYXRoKHJlc29sdmVkUGF0aC5wYXRoLCBzb3VyY2VEYXRhKTtcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5leHBvcnRzLmdldFZhbHVlID0gZ2V0VmFsdWU7XHJcblxyXG5mdW5jdGlvbiByZW5kZXIobWV0YSwgZGF0YSwgcmVzb2x2ZWRQYXRoKXtcclxuXHRyZXR1cm4gZ2V0VmFsdWUobWV0YSwgZGF0YSwgcmVzb2x2ZWRQYXRoKS50b1N0cmluZygpO1xyXG59O1xyXG5leHBvcnRzLnJlbmRlciA9IHJlbmRlcjtcclxuXHJcbmZ1bmN0aW9uIHJlc29sdmVBbmRSZW5kZXIobWV0YSwgZGF0YSwgcGF0aCl7XHJcblx0dmFyIHJlc29sdmVkUGF0aCA9IHJlc29sdmVQYXRoKG1ldGEsIHBhdGgpO1xyXG5cdHJldHVybiByZW5kZXIobWV0YSwgZGF0YSwgcGF0aCk7XHJcbn07XHJcbmV4cG9ydHMucmVzb2x2ZUFuZFJlbmRlciA9IHJlc29sdmVBbmRSZW5kZXI7XHJcbiJdfQ==
