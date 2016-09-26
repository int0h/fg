"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode, Tpl} from '../tplMgr';
import {IDataPath, IDataQuery, IScope} from '../valueMgr';

export interface IScopeItemParsedData extends IGapData {
	dataSource: IDataQuery;
	content: Tpl;
};

export default class GScopeItem extends Gap{
	scope: valueMgr.IScope;
	type: string = "scopeItem";
	dataSource: IDataQuery;
	content: Tpl;
	scopeId: number;

	static parse(node: IAstNode, parents: IGapData[]): Gap{
		return null;
	};

	render(context: FgInstance, data: any): string{
		const meta = this;
		const scopeData = valueMgr.getValue(meta, data, this.dataSource);		
		if (!scopeData){
			return '';
		};
		return context.renderTpl(meta.content, meta, data);
	};

};