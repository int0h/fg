"use strict";

import * as gapServer from './gapServer';
import {Gap, IGapData} from './client/gapClassMgr';
import * as utils from './utils';
import {FgInstance} from './client/fgInstance';
import {IAstNode} from './outerTypes';
import gaps from './gaps';

var mj = require('micro-jade');

export type TplData = (string | IGapData)[];

export class Template {
	parts: (string | Gap)[] = [];
	context: FgInstance;

	constructor(context: FgInstance, tplData: TplData, parent: Gap){
		this.context = context;
		this.parts = tplData.map((part) => {
			if (typeof part === "string"){
				return part;
			};
			const gapClassName = (part as IGapData).type;
			const GapClass = gaps[gapClassName];
			const gap = new GapClass(context, part as IGapData, parent);	 
			return gap;
		});
	};

	static parse(ast: IAstNode, code: string, parents: IGapData[]): TplData{	

		function iterate(children: IAstNode[]): TplData{
			let parts: TplData = [];
			children.forEach(function(node, id){
				const tagMeta = gapServer.parse(node, parents, code);
				if (tagMeta){				
					parts.push(tagMeta);				
					return; 
				};	
				if (!node.children || node.children.length == 0){
					parts.push(mj.render(node, {}));				
					return;
				};
				const wrap = mj.renderWrapper(node);
				parts.push(wrap[0]);
				parts = parts.concat(iterate(node.children));		
				if (wrap[1]){
					parts.push(wrap[1]);
				}
			});
			return parts;
		};

		return iterate(ast.children);
	};

	render(data: any){
		let parts: string[] = this.parts.map((part) => {
			if (typeof part === "string"){
				return part;
			};			
			return (part as Gap).render(this.context, data);
		});
		const code = parts.join('');
		return code;
	};
};
