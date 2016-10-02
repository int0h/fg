"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {Component} from '../client/componentBase';
import {IAstNode} from '../outerTypes';
import {Template, TplData} from '../tplMgr';

export interface IRootParsedData extends IGapData {
	content: TplData;
};

export default class GRoot extends Gap{
	fg: Component;
	content: Template;
	type: string = "root";

	public static isVirtual = true;

	constructor (parsedMeta: IRootParsedData){
		super(parsedMeta, null);
		this.content = new Template(parsedMeta.content, null); 
	};

	static parse(node: IAstNode): Gap{
		return null;
	};

	render(context: Component, data: any): string{
		return this.content.render(context, data);
	};

};