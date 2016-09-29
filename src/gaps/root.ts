"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../outerTypes';
import {Template, TplData} from '../tplMgr';

export interface IRootParsedData extends IGapData {
	content: TplData;
	scopePath: any;
};

export default class GRoot extends Gap{
	fg: FgInstance;
	content: Template;
	scopePath: any;
	type: string = "root";

	public static isVirtual = true;

	constructor (context: FgInstance, parsedMeta: IRootParsedData, parent: Gap){
		super(context, parsedMeta, parent);
		this.content = new Template(context, parsedMeta.content, parent); 
	};

	static parse(node: IAstNode): Gap{
		return null;
	};

	render(context: FgInstance, data: any): string{
		return this.content.render(data);
	};

};