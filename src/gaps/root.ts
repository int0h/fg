"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode, Tpl} from '../tplMgr';

export interface IRootParsedData extends IGapData {
	content: Tpl;
	scopePath: any;
};

export default class GRoot extends Gap{
	fg: FgInstance;
	content: Tpl;
	scopePath: any;
	type: string = "root";

	public static isVirtual = true; 

	static parse(node: IAstNode): Gap{
		return null;
	};

	render(context: FgInstance, data: any): string{
		return context.renderTpl(this.content, this, data);
	};

};