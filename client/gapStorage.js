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
		if (gapMeta.type != "root" && gapMeta.fg){
			gapMeta.fg.assign();
		};
	});
	return;
	var self = this;
	var gapNodes = this.context.dom.getElementsByClassName('fg-gap-' + this.context.id);
	for (var i = 0; i < gapNodes.length; i++){
		var gapNode = gapNodes[i];
		var gid = gapNode.getAttribute('data-fg-' + this.context.id + '-gap-id');
		var gap = self.gaps[gid];
		if (!gap){continue};
		if (gap.meta.fg){
			gap.meta.fg.assign();
		};
		gap.meta.dom = gapNode;
	};
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
	if (scope.childCount != 0 && !targetOnly){
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
		return !~removedGaps.indexOf(gap);
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
