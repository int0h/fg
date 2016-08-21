"use strict";

import * as gapClassMgr from './gapServer.ts';
import {Gap} from './client/gapClassMgr.ts';
import renderTplUnbound from './tplRender.ts';
export var renderTpl = renderTplUnbound.bind(null, gapClassMgr);
var mj = require('micro-jade');

export interface IAstNode {
    type: string;
	children: IAstNode[];
};

type ITplPart = string | Gap;

export type Tpl = ITplPart[];

function parseGap(node: IAstNode, html: string, parentMeta: Gap): Gap{
	var tagMeta = gapClassMgr.parse(node, html, parentMeta);
	return tagMeta;
};

export function readTpl(ast: IAstNode, code?: string, parentMeta?: Gap): Tpl{

	function iterate(children: IAstNode[]): Tpl{
		var parts = [];
		children.forEach(function(node, id){
			var tagMeta = parseGap(node, code, parentMeta);
			if (tagMeta){				
				parts.push(tagMeta);				
				return; 
			};	
			if (!node.children || node.children.length == 0){
				parts.push(mj.render(node, {}));				
				return;
			};
			var wrap = mj.renderWrapper(node);
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

// function tplToJson(tpl){ //?
// 	var parts = tpl.map(function(part){
// 		if (typeof part == "string"){
// 			return part;
// 		};
// 		return gapClassMgr.toJson(part);
// 	});
// 	return parts;
// };
