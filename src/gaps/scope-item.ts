"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
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

	constructor (context: FgInstance, parsedMeta: IGapData, parent: GScope){
		super(context, parsedMeta, parent);
		this.paths = [this.scope.path];
		this.content = parent.content;
	};

	render(context: FgInstance, data: any): string{
		const meta = this;
		const scopeData = valueMgr.getValue(meta, data, this.dataSource);		
		if (!scopeData){
			return '';
		};
		return this.content.render(data);
	};

};