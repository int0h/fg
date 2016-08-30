"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../tplMgr';

export default class GScopeItem extends Gap{
	scopePath: any;

	static parse(node: IAstNode){
		return null;
	};

	render(context: FgInstance, data: any){
		var meta = this;
		var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
		this.scopePath = this.resolvedPath.path;
		if (!scopeData){
			return '';
		};
		return context.renderTpl(meta.content, meta, data);
	};

};