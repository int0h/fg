"use strict";

import * as gapServer from './gapServer';
import {Gap, IGapData} from './client/gapClassMgr';
import renderTplUnbound from './tplRender';
export var renderTpl = renderTplUnbound.bind(null, gapServer);
var mj = require('micro-jade');

export interface IAstNode {
    type: string;
	children: IAstNode[];
	tagName?: string;
	attrs: any;
	text: string;
	parent: IAstNode;
	value?: {
		path: string,
		escaped: boolean
	};
};

export type ITplPart = string | IGapData;

export type Tpl = ITplPart[];

export function readTpl(ast: IAstNode, code: string, parents: IGapData[]): Tpl{	

	function iterate(children: IAstNode[]): Tpl{
		let parts: ITplPart[] = [];
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
