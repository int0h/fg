"use strict";

import * as utils from './utils';
import * as path from 'path';
import {IAstNode} from './tplMgr';
import {Gap} from './client/gapClassMgr';
import {FgInstance} from './client/fgInstance';
import {default as gaps} from './gaps';

/**
 * Reads the given ast and returns gap tree.
 * @param {object} ast - Parsed AST of a template.
 * @param {string} html - Source code of template. [deprecated]
 * @param {object} parentMeta - Parent gap.
 * @return {gap | null}
 */
export interface IGapMatch{
	gap: any;
	meta: any;
};

export function parse(ast: IAstNode, html: string, parentMeta: Gap){
	/*var name = ast.nodeName;
	var gap = gapTable[name];
	if (!gap){
		return false;
	};*/
	let matched: IGapMatch[] = [];
	for (let i in gaps){
		const gap: typeof Gap = gaps[i];
		const meta = gap.parse(ast, html, parentMeta);
		if (meta){
			matched.push({
				"gap": gap,
				"meta": meta
			});
		};
	};
	if (matched.length > 1){
		const maxPrior = Math.max.apply(Math, matched.map(function(item){
			return item.gap.priority || 0;
		}));		
		matched = matched.filter(function(item){
			return (item.gap.priority || 0) === maxPrior;
		});	
	}
	if (matched.length === 1){
		return matched[0].meta;
	};
	if (matched.length === 0){
		return null;
	};	
	if (matched.length > 1){
		throw new Error("Gap parsing conflict");
	};
	return null;
};