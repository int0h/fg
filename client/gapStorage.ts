"use strict";

import * as utils from '../utils.ts';
import {FgInstance} from './fgInstance.ts';
import {Gap} from './gapClassMgr.ts';
var TreeHelper = require('fg-js/utils/treeHelper.js');

function initNodeFn(){
	return {
		gaps: []
	};
};

export default class GapStorage{
	context: FgInstance;
	gaps: Gap[];
	scopeTree: any;
	eidDict: Object;

	constructor(context: FgInstance){
		this.context = context;
		this.gaps = [];
		this.scopeTree = new TreeHelper({
			kind: 'dict',
			initNode: initNodeFn
		});
		this.eidDict = {};	
	};

	setScopeTrigger(gap: Gap, scopePath){
		var scope = this.scopeTree.access(scopePath);	
		scope.data.gaps.push(gap);
	};

	setTriggers(gap: Gap, scopeTriggers){	
		scopeTriggers.forEach(this.setScopeTrigger.bind(this, gap));
	};

	reg(gap: Gap){
		var eid = gap.eid;
		if (eid){		
			this.eidDict[eid] = this.eidDict[eid] || [];
			this.eidDict[eid].push(gap);
		};
		var gid = this.getGid();
		gap.gid = gid;
		if (!gap.isVirtual){
			gap.attrs = utils.simpleClone(gap.attrs || {});		
			gap.attrs.id = ["fg", this.context.id, "gid", gid].join('-');
		};
		gap.storageId = this.gaps.length;
		this.gaps.push(gap);		
	};

	assign(){
		this.gaps.forEach(function(gapMeta){
			if (gapMeta.type !== "root" && gapMeta.fg){
				gapMeta.fg.assign();
			};
		});
		return;
	};

	byScope(scopePath, targetOnly?: boolean){
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
	removeScope(scopePath){
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
	byEid(eid){
		return this.eidDict[eid];
	};
	getGid(){
		return this.gaps.length;
	};
};