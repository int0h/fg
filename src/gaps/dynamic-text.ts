"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {StrTpl, read as readTpl} from '../StrTpl';  
import {GapClass, IGapOpts} from '../gapServer';  
import {Gap} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../tplMgr';

export default class GDynamicText extends Gap{

	tpl: any;

	static parse(node: IAstNode){
		if (node.type !== "text"){
			return null;
		};
		var tpl = readTpl(node.text, valueMgr.parse);
		if (typeof tpl === "string"){
			return null;
		};
		var meta: GDynamicText;
		meta.type = "dynamic-text";
		meta.tpl = tpl; 
		return meta;
	};

	render(context: FgInstance, data: any){
		var meta = this;
		var tpl = new StrTpl(meta.tpl, valueMgr.parse);
		return tpl.render(function(path){
			var dataMeta = {
				"type": "data",
				"path": path			
			};
			var itemMeta = new gapClassMgr.Gap(context, dataMeta, meta.parent);
			return gapClassMgr.render(context, meta.parent, data, itemMeta);
		});
	};

};