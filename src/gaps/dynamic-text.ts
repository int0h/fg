"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import * as strTpl from '../strTpl';  
import {Gap, IGapData} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../tplMgr';
import GData from './data';
import {IDataPath, IDataQuery} from '../valueMgr';

interface IDynamicTextParsedData extends IGapData {
	tpl: strTpl.StrTplData;
};

export default class GDynamicText extends Gap{

	tpl: strTpl.StrTplData;
	type: string = "dynamicText";

	static parse(node: IAstNode, parents: IGapData[]): IGapData{
		if (node.type !== "text"){
			return null;
		};
		const tpl = strTpl.parse(node.text, ref => {
			const parsedPath = valueMgr.parse(ref);
			const resolvedQuery = valueMgr.resolvePath(parsedPath, parents);
			return resolvedQuery;
		});
		if (typeof tpl === "string"){
			return null;
		};
		const meta: IDynamicTextParsedData = {
			type: "dynamicText",
			tpl: tpl as strTpl.StrTplData
		};
		return meta;
	};

	render(context: FgInstance, data: any){
		const meta = this;
		return strTpl.render(meta.tpl, function(dataSource: IDataQuery){
			const dataMeta = {
				"type": "data",
				"value": dataSource			
			};
			const itemMeta = new GData(context, dataMeta, meta.parent);
			return itemMeta.render(context, data);
		});
	};

};