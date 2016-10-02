"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {Component} from '../client/componentBase';  
import {IAstNode} from '../outerTypes'; 
import {Template, TplData} from '../tplMgr';
import {IDataPath, IDataQuery, IScope} from '../valueMgr';
import GScope from './scope';

export interface IScopeItemParsedData extends IGapData {
	dataSource: IDataQuery;
	content: TplData;
};

export default class GScopeItem extends Gap{
	scope: valueMgr.IScope;
	type: string = "scopeItem";
	dataSource: IDataQuery;
	content: Template;
	scopeId: number;

	constructor (parsedMeta: IGapData, parent: GScope){
		super(parsedMeta, parent);
		this.paths = [this.scope.path];
		this.content = parent.content;
	};

	render(context: Component, data: any): string{
		const meta = this;
		const scopeData = valueMgr.getValue(meta, data, this.dataSource);		
		if (!scopeData){
			return '';
		};
		return this.content.render(context, data);
	};

};