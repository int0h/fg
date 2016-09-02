"use strict";

import * as gapClassMgr from './gapServer';
import {Gap} from './client/gapClassMgr';
import renderTplUnbound from './tplRender';
export var renderTpl = renderTplUnbound.bind(null, gapClassMgr);
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

export type ITplPart = string | Gap;

export type Tpl = ITplPart[];

function parseGap(node: IAstNode, html: string, parentMeta: Gap): Gap{
	const tagMeta = gapClassMgr.parse(node, html, parentMeta);
	return tagMeta;
};

export function readTpl(ast: IAstNode, code?: string, parentMeta?: Gap): Tpl{

	function iterate(children: IAstNode[]): Tpl{
		let parts: (string | Gap)[] = [];
		children.forEach(function(node, id){
			const tagMeta = parseGap(node, code, parentMeta);
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
